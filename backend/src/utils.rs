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
