## API

### Llamadas relativas a usuario.

1.- Crear cuenta: Front envía correo, nombre de usuario y contraseña. POST /users/:email/accounts. body: Nombre de usuario y contraseña. 

2.- Login: Front envía correo y contraseña. POST /users/login. body : Correo electrónico y contraseña.

3.- Visualización perfil: La API devolverá el icono, nombre, victorias, derrotas, monedas que tiene, skin actual de escalera, de serpiente y de ficha. GET /users/:email/profile

3.1.- Iconos usuario: Front pide los iconos que el usuario tiene disponibles. GET /users/:email/icons

3.1.1.- Cambio Icono: Front envía email e icono . POST /users/:email/new-icon

3.2.- Idem para escaleras. 

3.2.1 .- Idem para escaleras

3.3.- Idem para ficha

3.3.1.- Idem para ficha

3.4 // Usuario

### Llamadas relativas a Logros

1.- Ver Estadísticas: La API devuelve todas las estadísticas del jugador y los logros completados. GET /users/:email/stats

2.- Ver Logros: La API devuelve todos los logros. GET /achievements

3.- Obtener Logro: Front envía el identificador del logro y del usuario y la API se encarga de dar la recompensa del logro al usuario. POST /achievements/:id-achievement/rewards. body: email del usuario.