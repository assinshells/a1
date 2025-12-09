export const formatDistanceToNow = (date) => {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "только что";
  } else if (minutes < 60) {
    return `${minutes} мин. назад`;
  } else if (hours < 24) {
    return `${hours} ч. назад`;
  } else if (days === 1) {
    return "вчера";
  } else if (days < 7) {
    return `${days} дн. назад`;
  } else {
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  }
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
