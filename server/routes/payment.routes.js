import {Router} from "express";
import { allPayments, buySubscription, cancelSubcription, getRazorpayApiKey , storedb, verifySubscription } from "../controllers/payment.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import authorizedRoles from "../middlewares/Authorize.middleware.js";

const router=Router();

// store data in db
 router
      .route('/d')
      .post(storedb);

router
     .route('/razorpay-key')
     .get(
        isLoggedIn,
        getRazorpayApiKey
     );


router
     .route('/subscribe')
     .post(
        isLoggedIn,
        buySubscription
     );

router
     .route('/verify')
     .post(
        isLoggedIn,
        verifySubscription
    );
         
     
router
     .route('/unsubscribe')
     .post(
        isLoggedIn,
        cancelSubcription
    );  
     
     
    //  for admin that show all the payment related info
router
     .route('/')
     .get(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        allPayments
    );
     
     export default router;

        
