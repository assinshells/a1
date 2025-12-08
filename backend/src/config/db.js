import mongoose from "mongoose";

const MONGO_URI = "mongodb://localhost:27017/mydb";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB подключена"))
  .catch((err) => console.error("Ошибка подключения MongoDB:", err));
