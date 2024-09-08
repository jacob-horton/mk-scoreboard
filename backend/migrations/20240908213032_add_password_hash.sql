CREATE TABLE
  public.admin_user (
    id serial NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL
  );

ALTER TABLE
  public.admin_user
ADD
  CONSTRAINT admin_user_pkey PRIMARY KEY (id);

ALTER TABLE
  public.admin_user
ADD
  CONSTRAINT username_unique UNIQUE (username);

