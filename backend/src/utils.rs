pub fn std_dev(sum: f32, sum_of_squares: f32, n: i32) -> f32 {
    let mean = sum / n as f32;
    let mean_squares = sum_of_squares / n as f32;
    (mean_squares - mean.powi(2)).sqrt()
}
