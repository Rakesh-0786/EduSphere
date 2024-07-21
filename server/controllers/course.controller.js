import AppError from "../utils/error.util.js";
import Course from "../models/course.model.js";
import fs from "fs/promises";
import cloudinary from "cloudinary";

//  Store courses
const storeCourses = async (req, res, next) => {
  const {
    title,
    description,
    category,
    thumbnail,
    lectures = [],
    numberOfLectures,
    createdBy,
  } = req.body;

  if (
    !title ||
    !description ||
    !category ||
    !thumbnail ||
    !numberOfLectures ||
    !createdBy
  ) {
    console.error("Missing field(s) in request body:", req.body);
    return next(new AppError("All fields are required", 400));
  }

  try {
    // Check if the course with the same title already exists
    const courseExists = await Course.findOne({ title });
    if (courseExists) {
      console.error("Course title already exists:", title);
      return next(new AppError("Course title already exists", 400));
    }

    // Store  the new course
    const course = await Course.create({
      title,
      description,
      category,
      thumbnail,
      lectures,
      numberOfLectures,
      createdBy,
    });

    console.log("Course created successfully:", course);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (e) {
    console.error("Error creating course:", e);
    return next(new AppError(e.message, 500));
  }
};

const getAllCourses = async function (req, res, next) {
  try {
    const courses = await Course.find({}).select("-lectures");

    res.status(200).json({
      success: true,
      message: "All courses",
      courses,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const getLecturesByCourseId = async function (req, res, next) {
  try {
    const { id } = req.params;
    console.log("Course Id >", id);
    const course = await Course.findById(id);
    console.log("Course Details >", course);

    if (!course) {
      return next(new AppError("Invalid Course id", 400));
    }

    res.status(200).json({
      success: true,
      message: "Course Lectures fetched successfully",
      lectures: course.lectures,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !category || !createdBy) {
      return next(new AppError("All fields are required", 400));
    }

    const course = await Course.create({
      title,
      description,
      category,
      createdBy,
    });

    if (!course) {
      return next(
        new AppError("Course could not created, please try again", 500)
      );
    }

    // file upload
    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "EduSphere",
      });
      console.log(JSON.stringify(result));

      if (result) {
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }

      fs.rm(`uploads/${req.file.filename}`);
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course successfully created",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      {
        runValidators: true,
      }
    );

    if (!course) {
      return next(new AppError("Course with given id does not exist", 500));
    }

    res.status(200).json({
      success: true,
      message: "Course update succesfully",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const removeCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("Course with given id does not exist", 500));
    }

    await Course.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      course: "Course deleted successfully",
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const addLectureToCourseById = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const { id } = req.params;

    if (!title || !description) {
      return next(new AppError('All fields are required', 400));
    }

    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError('Course with given id does not exist', 500));
    }

    const lectureData = {
      title,
      description,
      lecture:{}
    };

    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "EduSphere",
        });

        if (result) {
          lectureData.lecture = {
            public_id: result.public_id,
            secure_url: result.secure_url,
          };
        }
        fs.rm(`uploads/${req.file.filename}`);
      } catch (e) {
        return next(new AppError(e.message, 500));
      }
    }
     console.log('lecture >', JSON.stringify(lectureData));
    // Push new lecture into the lectures array
    course.lectures.push(lectureData);
    course.numberOfLectures = course.lectures.length;

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Lecture successfully added to the course',
      course,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

// deleting lecture from course 

const deleteLectureFromCourseById = async (req, res, next) => {
  const { courseId, lectureId } = req.params;

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError('Course with given id does not exist', 500));
    }

    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId
    );

    if (lectureIndex === -1) {
      return next(new AppError('Lecture with given id does not exist', 500));
    }

    const lecture = course.lectures[lectureIndex];

    if (lecture.lecture && lecture.lecture.public_id) {
      await cloudinary.v2.uploader.destroy(lecture.lecture.public_id);
    }

    course.lectures.splice(lectureIndex, 1);
    course.numberOfLectures = course.lectures.length;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Lecture successfully deleted from the course',
      course
    });

  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};


export {
  storeCourses,
  getAllCourses,
  getLecturesByCourseId,
  createCourse,
  updateCourse,
  removeCourse,
  addLectureToCourseById,
  deleteLectureFromCourseById
};
