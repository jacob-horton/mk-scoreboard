use chrono::{Datelike, NaiveDate};

pub fn is_birthday(birthday: &Option<NaiveDate>) -> bool {
    if let Some(bday) = birthday {
        let today = chrono::offset::Local::now().date_naive();
        if bday.month0() == today.month0() && bday.day0() == today.day0() {
            return true;
        }
    }

    false
}

pub fn modify_birthday(name: &str, birthday: &Option<NaiveDate>) -> String {
    let mut name = String::from(name);
    if is_birthday(birthday) {
        name = format!("🎁 {name}");
    }

    name
}

pub fn std_dev(sum: f32, sum_of_squares: f32, n: i32) -> f32 {
    let mean = sum / n as f32;
    let mean_squares = sum_of_squares / n as f32;
    (mean_squares - mean.powi(2)).sqrt()
}
