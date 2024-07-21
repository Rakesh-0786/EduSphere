import { Router } from "express";
import {
  createCourse,
  getAllCourses,
  getLecturesByCourseId,
  removeCourse,
  storeCourses,
  updateCourse,
} from "../controllers/course.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router.route('/s')
.post(storeCourses)

router.route("/")
.get(getAllCourses)
.post(
  upload.single('thumbnail'),
  createCourse
); 

// if the user is loggedin then that user can see the lectures
router.route("/:id")
.get(isLoggedIn, getLecturesByCourseId)
.put(updateCourse)
.delete(removeCourse);

export default router;
