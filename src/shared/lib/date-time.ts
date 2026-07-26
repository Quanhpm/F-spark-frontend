function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateTimeLocalValue(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function getMinimumDateTimeLocal() {
  const minimum = new Date();
  minimum.setSeconds(0, 0);
  minimum.setMinutes(minimum.getMinutes() + 1);
  return toDateTimeLocalValue(minimum);
}
