# API.
---

## Usuario.


### **POST** /api/auth/new_users
### **POST** /api/auth/new_users
- Crea un nuevo usuario en el sistema.
- Body: "email", "username" y "password".

### **POST** /api/auth/login
- Inicia sesión en el sistema.
- Body: "email" y "password".

### **POST** /api/auth/cookie_login
- Inicia sesión en el sistema.
- Body: cookies jwt.

### **GET** /api/users/:email/profile
- Devuelve la información del perfil (icono, nombre, victorias, derrotas, monedas que tiene, skin actual de escalera, de serpiente y de ficha).

### **GET** /api/users/:email/icons
- Devuelve todos los iconos que el usuario tiene.

###  **PUT** /api/users/:email/icon
- Actualiza el icono del usuario.
- Body: "icon".

### **GET** /api/users/:email/stairs
- Devuelve todas las skins de escaleras que tiene el usuario.

### **PUT** /api/users/:email/stair
- Actualiza la skin de escalera del usuario.
- Body: "stair".

### **GET** /api/users/:email/pawns
- Devuelve todas las skins de fichas que tiene el usuario.

### **PUT** /api/users/:email/pawn
- Actualiza la skin de ficha del usuario.
- Body: "pawn".

### **PUT** /api/users/:email/username
- Actualiza el nombre del usuario.
- Body: "username".


## Logros.


### **GET** /api/users/:email/stats
- Devuelve las estadísticas del jugador, así como los logros completados.

### **GET** /api/achievements
- Devuelve todos los logros existentes.

### **POST** /api/users/:email/achievements
- Marca como completado el logro y le otorga la recompensa al usuario.
- Body: "achievement_id".


## MAZOS.


### **GET** /api/users/:email/decks 
- Devuelve todos los mazos y los nombres de las cartas que lo componen asociados al usuario.

### **GET** /api/users/:email/decks/:deck-id/cards
- Devuelve las cartas que componen un mazo, junto a toda la información acerca de estas.

### **POST** /api/users/:email/decks
- Crea un mazo nuevo asociado al usuario. Devuelve error si incluye alguna carta ilegal/no conseguida.
- Body: "deck_name" y "cards".

### **PUT** /api/users/:email/decks/:deck-id
- Modifica el mazo con deck-id asociado al usuario. Devuelve error si incluye alguna carta ilegal/no conseguida.
- Body: "deck_name" y "cards".

### **DELETE** /api/users/:email/decks/:deck-id
- Borra, si posible, el mazo del usuario.


## CARTAS


### **GET** /api/cards
- Devuelve todas las cartas disponibles en el sistema, junto a toda su información.

### **GET** /api/users/:email/cards
- Devuelve las cartas que tiene desbloqueadas el usuario.


## LOBBIES.


### **POST** /api/lobbies
- Crea un nuevo lobby en el sistema. El usuario que la crea se convierte en el líder.
- Body: "email" y "username".

### **GET** /api/lobbies/:lobby-id
- Devuelve la información asociada a un lobby. Sirve también para comprobar si la partida ya ha sido iniciada.

### **POST** /api/lobbies/:lobby-id/players
- Un jugador se une a la lobby si es posible.
- Body: "email" y "username".

### **POST** /api/lobbies/:lobby-id/bots
- Añade un bot al lobby si es posible.
- Body: "requested_by".

### **PUT** /api/lobbies/:lobby-id/players/:email/deck
- Selecciona el mazo a jugar en la partida por el usuario.
- Body: "deck_name".

### **PUT** /api/lobbies/:lobby-id/players/:email/ready
- Establece si el jugador está listo o no para comenzar la partida.
- Body: "is_ready".

### **DELETE** /api/lobbies/:lobby-id/players/:email
- El jugador abandona el lobby o es expulsado por el líder. Si el usuario que abandona es el líder se destruye el lobby.
- Body: "requested_by".


## PARTIDAS


### **POST** /api/matches
- Inicia la partida. Dados los datos del lobby crea la partida y destruye el lobby.
- Body: "lobby_id".

### **GET** /api/users/:email/matches
- Devuelve las partidas activas en las que está el usuario.

### **GET** /api/matches/:match_id/board
- Devuelve el estado del tablero en el momento actual.

### **GET** /api/matches/:match_id/players
- Devuelve el estado de los jugadores de la partida en el momento actual. Recibiendo el usuario que hace la petición le devuelve información exclusiva, como la mano del mazo en el turno.

### **POST** /api/matches/:match_id/cards
- El usuario juega una carta y se actualiza el estado de la partida.
- Body: "email", "card_id" y "target" (si necesario).

### **POST** /api/matches/:match_id/dice
- Tira los dados de un usuario y devuelve todos los posibles movimientos del usuario.
- Body: "email".

### **POST** /api/matches/:match_id/final-location
- Comprueba si en la casilla destino existe algún tipo de efecto. Si lo hay lo aplica y devuelve qué cambios ha realizado dicho efecto.
- Body: "email".


## ES MUY POSIBLE QUE FALTEN ALGUNAS LLAMADAS