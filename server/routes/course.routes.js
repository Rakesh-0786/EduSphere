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
import authorizedRoles from "../middlewares/Authorize.middleware.js";

const router = Router();

router.route("/s").post(storeCourses);

router
  .route("/")
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("thumbnail"),
    createCourse
  );

// if the user is loggedin then that user can see the lectures
router
  .route("/:id")
  .get(isLoggedIn, getLecturesByCourseId)
  .put(isLoggedIn, authorizedRoles("ADMIN"), updateCourse)
  .delete(isLoggedIn, authorizedRoles("ADMIN"), removeCourse);

export default router;
