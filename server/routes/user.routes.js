import { Router } from "express";
import { getPrfile, login, logout, register } from "../controllers/user.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
const router=Router();

// for Register
router.post('/register', upload.single("avatar"), register);
router.post('/login',login);
router.get('/logout',logout);
router.get('/me',isLoggedIn, getPrfile);




export default router;