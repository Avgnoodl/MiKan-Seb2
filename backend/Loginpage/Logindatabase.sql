PGDMP      ,                }            Logindatabase    17.5    17.5                0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false                       1262    16482    Logindatabase    DATABASE     �   CREATE DATABASE "Logindatabase" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_Malaysia.1252';
    DROP DATABASE "Logindatabase";
                     postgres    false            �            1259    16483    users    TABLE     n   CREATE TABLE public.users (
    username text NOT NULL,
    password text NOT NULL,
    role text NOT NULL
);
    DROP TABLE public.users;
       public         heap r       postgres    false                      0    16483    users 
   TABLE DATA           9   COPY public.users (username, password, role) FROM stdin;
    public               postgres    false    217   j       �           2606    16489    users users_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (username);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    217               .   x�s�-�ɯLM�L�2
���.�ļ���"�\����b���� ��     