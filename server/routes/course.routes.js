import { Router } from "express";
import {
  getAllCourses,
  getLecturesByCourseId,
  storeCourses,
} from "../controllers/course.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getAllCourses).post(storeCourses); // This should handle the POST request to create a new course

// if the user is loggedin then that user can see the lectures
router.route("/:id").get(isLoggedIn, getLecturesByCourseId);

export default router;
