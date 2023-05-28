use chrono::{Datelike, NaiveDate};

pub fn modify_birthday(name: &str, birthday: &Option<NaiveDate>) -> String {
    let mut name = String::from(name);
    if let Some(bday) = birthday {
        let today = chrono::offset::Local::now().date_naive();
        if bday.month0() == today.month0() && bday.day0() == today.day0() {
            name = format!("🎁 {name}");
        }
    }

    name
}
