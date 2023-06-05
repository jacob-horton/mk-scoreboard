-- Add migration script here
CREATE TABLE
  public.game (
    id serial NOT NULL,
    date timestamp without time zone NOT NULL DEFAULT now(),
    group_id integer NOT NULL DEFAULT 1
  );

ALTER TABLE
  public.game
ADD
  CONSTRAINT game_pkey PRIMARY KEY (id);

CREATE TABLE
  public.game_score (
    id serial NOT NULL,
    score integer NOT NULL,
    game_id integer NOT NULL,
    player_id integer NOT NULL
  );

ALTER TABLE
  public.game_score
ADD
  CONSTRAINT game_score_pkey PRIMARY KEY (id);

CREATE TABLE
  public.grp (
    id serial NOT NULL,
    name text NOT NULL,
    max_score integer NULL
  );

ALTER TABLE
  public.grp
ADD
  CONSTRAINT grp_pkey PRIMARY KEY (id);

CREATE TABLE
  public.player (id serial NOT NULL, name text NOT NULL, birthday date NULL);

ALTER TABLE
  public.player
ADD
  CONSTRAINT player_pkey PRIMARY KEY (id);
  
CREATE TABLE
  public.player_group (
    id serial NOT NULL,
    player_id integer NOT NULL,
    group_id integer NOT NULL
  );

ALTER TABLE
  public.player_group
ADD
  CONSTRAINT player_group_pkey PRIMARY KEY (id);
