import { razorpay } from "../server.js";
import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import Payment from "../models/payment.model.js";
import crypto from "crypto";

const storedb = async (req, res, next) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
    req.body;

  if (
    !razorpay_payment_id ||
    !razorpay_subscription_id ||
    !razorpay_signature
  ) {
    return next(new AppError("All fields are required", 400));
  }
  try {
    const paymentExist = await Payment.findOne({ razorpay_payment_id });

    if (paymentExist) {
      return next(new AppError("payment id already exists", 400));
    }

    const payment = await Payment.create({
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    });

    res.status(201).json({
      success: true,
      message: "Payment id Created Successfully",
      payment,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const getRazorpayApiKey = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Razorpay API key",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return next(new AppError(e.message));
  }
};

const buySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;

    if (!id) {
      console.error("Error: User ID is missing");
      throw new Error("User ID is missing");
    }

    const user = await User.findById(id);
    if (!user) {
      console.error("Error: User not found");
      throw new Error("User not found");
    }

    if (user.role === "ADMIN") {
      console.error("Error: Admin cannot purchase a subscription");
      throw new Error("Admin cannot purchase a subscription");
    }

    console.log("Creating subscription on Razorpay...");

    // Create subscription on Razorpay with total_count
    let subscription;
    try {
      subscription = await razorpay.subscriptions.create({
        plan_id: process.env.RAZORPAY_PLAN_ID,
        total_count: 12, // Specify the total number of billing cycles
        customer_notify: 1,
      });
    } catch (razorpayError) {
      console.error("Error from Razorpay:", razorpayError);
      throw new Error("Failed to create subscription with Razorpay");
    }

    if (!subscription) {
      console.error("Error: Subscription object is undefined");
      throw new Error("Failed to create subscription");
    }

    console.log("Subscription created:", subscription);

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    console.log("User subscription updated and saved:", user);

    res.status(200).json({
      success: true,
      message: "Subscribed Successfully",
      subscription_id: subscription.id,
    });
  } catch (error) {
    console.error("Error in buySubscription:", error.message);
    res.status(500).json({
      success: false,
      message: "Something Went Wrong!",
      error: error.message,
    });
  }
};

const verifySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError("Unauthorized, please login", 400));
    }

    const subscriptionId = user.subscription.id;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_payment_id}|${subscriptionId}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return next(new AppError("Payment not verified, please try again", 500));
    }

    await Payment.create({
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    });

    user.subscription.status = "active";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
    });
  } catch (e) {
    return next(new AppError(e.message));
  }
};

const cancelSubcription = async (req, res, next) => {
  try {
    const { id } = req.user;

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("Unauthorized, please login"));
    }

    if (user.role === "ADMIN") {
      return next(new AppError("Admin cannot purchase a subscription", 400));
    }

    const subscriptionId = user.subscription_id;

    const subscription = await razorpay.subscriptions.cancel(subscriptionId);

    user.subscription.status = subscription.status;

    await user.save();
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// admin panel

const allPayments = async (req, res, next) => {
  try {
    const { count, skip } = req.query;

    const subscriptions = await razorpay.subscriptions.all({
      count: count ? count : 10, // If count is sent then use that else default to 10
      skip: skip ? skip : 0, // If skip is sent then use that else default to 0
    });

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const finalMonths = {
      January: 0,
      February: 0,
      March: 0,
      April: 0,
      May: 0,
      June: 0,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 0,
    };

    const monthlyWisePayments = subscriptions.items.map((payment) => {
      // We are using payment.start_at which is in unix time, so we are converting it to Human readable format using Date()
      const monthsInNumbers = new Date(payment.start_at * 1000);

      return monthNames[monthsInNumbers.getMonth()];
    });

    monthlyWisePayments.map((month) => {
      Object.keys(finalMonths).forEach((objMonth) => {
        if (month === objMonth) {
          finalMonths[month] += 1;
        }
      });
    });

    const monthlySalesRecord = [];

    Object.keys(finalMonths).forEach((monthName) => {
      monthlySalesRecord.push(finalMonths[monthName]);
    });

    res.status(200).json({
      success: true,
      message: "All payments",
      subscriptions,
      finalMonths,
      monthlySalesRecord,
    });
  } catch (e) {
    return next(new AppError(e.message));
  }
};

export {
  getRazorpayApiKey,
  buySubscription,
  verifySubscription,
  cancelSubcription,
  allPayments,
  storedb,
};
