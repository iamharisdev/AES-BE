// utils/date-range.ts
export const getUTCDayRange = (date = new Date()) => {
  const from = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0, 0
  ));

  const to = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23, 59, 59, 999
  ));

  return { from, to };
};

export const getUTCDateRange = (start: Date, end: Date) => {
  const from = new Date(Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
    0, 0, 0, 0
  ));

  const to = new Date(Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
    23, 59, 59, 999
  ));

  return { from, to };
};
