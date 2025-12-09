import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null для публичных сообщений
    },
    room: {
      type: String,
      default: "general", // Комната по умолчанию
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    attachments: [
      {
        url: String,
        filename: String,
        mimetype: String,
        size: Number,
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Индексы для оптимизации запросов
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ isDeleted: 1 });

// Метод для пометки сообщения как прочитанного
messageSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Метод для редактирования сообщения
messageSchema.methods.edit = async function (newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return await this.save();
};

// Метод для мягкого удаления сообщения
messageSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

// Виртуальное поле для проверки, является ли сообщение приватным
messageSchema.virtual("isPrivate").get(function () {
  return this.receiver !== null;
});

// Статический метод для получения истории чата
messageSchema.statics.getChatHistory = async function (
  userId,
  targetId,
  limit = 50,
  skip = 0
) {
  return await this.find({
    $or: [
      { sender: userId, receiver: targetId },
      { sender: targetId, receiver: userId },
    ],
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("sender", "username avatar status")
    .populate("receiver", "username avatar status");
};

// Статический метод для получения сообщений комнаты
messageSchema.statics.getRoomMessages = async function (
  roomName,
  limit = 50,
  skip = 0
) {
  return await this.find({
    room: roomName,
    receiver: null,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("sender", "username avatar status");
};

const Message = mongoose.model("Message", messageSchema);

export default Message;
