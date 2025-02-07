const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
    TaskNo: {
        type: String,
        required: true,
    },
    task: {
        type: String,
        required: true,
        unique: true
    },
    result:{
        type:Boolean
    },
    response:{
        type:String
    }
});

const UserModel = mongoose.model('tasks', TaskSchema);
module.exports = UserModel;