const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')

const UserSchema = new Schema(
    {
        user: {
          name: { type: String, required: true },
          username: { type: String },
          email: {
            type: String,
            required: true,
            match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
          },
          password: { type: String },
          token: { type: String },
          
          verified: {
            email: { type: Boolean, default: false },
          },
        },
        role: {
          type: String,
          enum: ["superadmin", "admin", "user"],
          default: "user",
        },
        loggedInDevices: [
          {
            deviceFingerprint: { type: String, required: true }
          },
          
        ],

})



const User = mongoose.model('User', UserSchema)
module.exports = User