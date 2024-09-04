use actix_web::{get, HttpRequest, HttpResponse, Responder};
use reqwest::Error;

async fn get_server_ip() -> Result<String, Error> {
    let response = reqwest::get("https://ip.me").await?;
    return Ok(response.text().await?.trim().to_owned());
}

pub async fn is_authorised(remote_addr: Option<&str>) -> Result<bool, Error> {
    let server_ip = get_server_ip().await?;
    return Ok(Some(server_ip.as_str()) == remote_addr);
}

#[get("/auth")]
pub async fn auth(req: HttpRequest) -> impl Responder {
    let conn_info = req.connection_info();
    let client_remote_ip = conn_info.realip_remote_addr();

    let Ok(authed) = is_authorised(client_remote_ip).await else {
        return HttpResponse::InternalServerError();
    };

    if authed {
        return HttpResponse::NoContent();
    } else {
        return HttpResponse::Unauthorized();
    }
}
