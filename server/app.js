import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {config} from "dotenv";
import morgan from 'morgan';
import userRoutes from "./routes/user.routes.js";
import errorMiddleware from './middlewares/error.middleware.js';
import dotenv from "dotenv";

dotenv.config();

const app=express();


app.use(express.json());
app.use(cors({
    origin:[process.env.FRONTEND_URL],
    credentials:true
}));

app.use(cookieParser());

app.use(morgan('dev'));  //logging 

app.use('/ping', (req,res) =>{
    res.send('Pong');
});

// define the path for  user rautes 

app.use('/api/v1/user', userRoutes)

app.all('*',(req,res) =>{
    res.status(400).send('OOPS!! 404 page not found');
    });

    // middleware for error handling

    app.use(errorMiddleware);


    export default app;