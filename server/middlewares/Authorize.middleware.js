import AppError from "../utils/error.util.js";
import jwt from 'jsonwebtoken';



// authorization
const authorizedRoles=(...roles) => async (req,res,next) => {
    const currentUserRole= req.user.role;
    if(!roles.includes(currentUserRole)) {
        return next(
            new AppError('You do not have permission to access this route',400)
        )
    }
    next();
}

export default authorizedRoles;