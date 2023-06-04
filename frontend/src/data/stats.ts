export function stdDev(data: number[]) {
  let sum = 0;
  let sumOfSquares = 0;

  for (const point of data) {
    sum += point;
    sumOfSquares += point * point;
  }

  let mean = sum / data.length;
  let meanOfSquares = sumOfSquares / data.length;

  return Math.sqrt(meanOfSquares - mean * mean);
}
