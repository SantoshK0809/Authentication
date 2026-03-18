import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email : {
        type : String,
        required : [true, "Email is required."]
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : [true, "User ID is required."]
    },
    otpHash : {
        type : String,
        required : [true, "OTP hash is required."]
    },
    expiresAt : {
        type : Date,
        required : [true, "Expiration time is required."]
    }
});

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;