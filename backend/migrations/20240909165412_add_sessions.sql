CREATE TABLE
  public.admin_session (
    id UUID NOT NULL,
    user_id INT NOT NULL
  );

ALTER TABLE
  public.admin_session
ADD
  CONSTRAINT admin_session_pkey PRIMARY KEY (id);

ALTER TABLE
  public.admin_session
ADD
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES admin_user(id);
