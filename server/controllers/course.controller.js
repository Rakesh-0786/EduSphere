import AppError from "../utils/error.util.js";
import Course from "../models/course.model.js";

const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({}).select(`-lectures`);

    res.status(200).json({
      success: true,
      message: "All courses",
      courses,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// get specific course
const getLecturesByCourseId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return next(new AppError("course not found", 500));
    }

    res.status(200).json({
      success: true,
      message: "course",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

export { getAllCourses, getLecturesByCourseId };
