import { Router } from "express";
import {
  addLectureToCourseById,
  createCourse,
  getAllCourses,
  getLecturesByCourseId,
  removeCourse,
  storeCourses,
  updateCourse,
  deleteLectureFromCourseById // Added import for deleteLecture function
} from "../controllers/course.controller.js";
import isLoggedIn, { authorizeSubscribers } from "../middlewares/auth.middleware.js";
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
  .get(isLoggedIn,authorizeSubscribers, getLecturesByCourseId)
  .put(isLoggedIn, authorizedRoles("ADMIN"), updateCourse)
  .delete(isLoggedIn, authorizedRoles("ADMIN"), removeCourse)
  .post(isLoggedIn, authorizedRoles('ADMIN'), upload.single('lecture'), addLectureToCourseById);

// Route for deleting a lecture
router
  .route("/:courseId/lecture/:lectureId")
  .delete(isLoggedIn, authorizedRoles("ADMIN"), deleteLectureFromCourseById);

export default router;
