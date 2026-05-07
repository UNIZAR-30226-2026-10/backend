# API
---

## /api/achievements

### **GET** /api/achievements
- Devuelve todos los logros existentes.

## /api/auth

### **POST** /api/auth/cookie_login
- Inicia sesión en el sistema.
- Body: cookies jwt.

### **POST** /api/auth/login
- Inicia sesión en el sistema.
- Body: "email" y "password".

### **POST** /api/auth/new_users
- Crea un nuevo usuario en el sistema.
- Body: "email", "username" y "password".

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

### **GET** /api/users/:email/snakes
- Devuelve todas las skins de serpientes que tiene el usuario.

### **PUT** /api/users/:email/snake
- Actualiza la skin de serpiente del usuario.
- Body: "snake".

### **PUT** /api/users/:email/username
- Actualiza el nombre del usuario.
- Body: "username".


## Cosméticos.


### **GET** /api/cosmetics/store/:email
- Devuelve todos los cosméticos disponibles para comprar y si el usuario tiene cada uno de ellos o no.

### **POST** /api/cosmetics/store/:email
- Compra un cosmetico.
- Body: "cosmetic_name".


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


## /api/cards

### **GET** /api/cards
- Devuelve todas las cartas disponibles en el sistema, junto a toda su información.

## /api/boards

### **GET** /api/boards
- Devuelve todos los tableros disponibles en el sistema. Devuelve el nombre de cada uno.

## /api/lobbies

### **POST** /api/lobbies
- Crea un nuevo lobby en el sistema. El usuario que la crea se convierte en el líder.
- Body: "username".

### **GET** /api/lobbies/by-player/:username
- Devuelve la información del lobby al que pertenece un jugador.

### **GET** /api/lobbies/:lobbyId
- Devuelve la información asociada a un lobby. Sirve también para comprobar si la partida ya ha sido iniciada.

### **POST** /api/lobbies/:lobbyId/invitations
- Envía una invitación a un amigo para que se una al lobby.
- Body: "inviteFrom" y "inviteFor".

### **PUT** /api/lobbies/:lobbyId/invitations
- Acepta o rechaza una invitación a un lobby.
- Body: "inviteFor", "inviteFrom" y "accept" (boolean).

### **POST** /api/lobbies/:lobbyId/bots
- Añade un bot al lobby si es posible.
- Body: "requested_by".

### **PUT** /api/lobbies/:lobbyId/players/:username/deck
- Selecciona el mazo a jugar en la partida por el usuario.
- Body: "deck".

### **PUT** /api/lobbies/:lobbyId/players/:username/ready
- Establece si el jugador está listo o no para comenzar la partida.
- Body: "ready".

### **PUT** /api/lobbies/:lobbyId/board
- Establece el tablero a jugar en la partida.
- Body: "requested_by" y "board".

### **DELETE** /api/lobbies/:lobbyId/players/:targetUsername
- El jugador abandona el lobby o es expulsado por el líder. Si el usuario que abandona es el líder se destruye el lobby.
- Body: "requested_by".

## /api/matches

### **POST** /api/matches
- Inicia la partida. Dados los datos del lobby crea la partida y destruye el lobby.
- Body: "lobby_id".

### **POST** /api/matches/:matchId/chat/:username
- Envía un mensaje al chat de la partida.
- Body: "message".

### **GET** /api/matches/:matchId/chat/:username
- Devuelve el chat de la partida. Valida que el usuario que hace la petición pertenece a la partida.

### **GET** /api/matches/:matchId/:username
- Devuelve el estado de los jugadores de la partida en el momento actual. Recibiendo el usuario que hace la petición le devuelve información exclusiva, como la mano del mazo en el turno.

### **POST** /api/matches/:matchId/cards/:username
- El usuario juega una carta y se actualiza el estado de la partida.
- Body: "card_id", "who" (si necesario. Dependiendo de si es sobre una ficha o user, será un number o string, respectivamente), inicio y fin (si necesario).

### **POST** /api/matches/:matchId/dice/:username
- Tira el dado de un usuario (dado los efectos que tiene a consecuencia de las cartas) y devuelve todos los posibles movimientos del usuario de cada una de las fichas (si posible) dada la tirada.

### **POST** /api/matches/:matchId/pawn/:username
- Actualiaza la posición de una ficha en el tablero.
- Body: "pawn_id", "final_position" y steps_remaining.

## /api/users

### **POST** /api/users/:email/:friendUsername/friends
- Envía al usuario con friendUsername una solicitud de amistad.

### **POST** /api/users/:email/achievements
- Marca como completado el logro y le otorga la recompensa al usuario.
- Body: "achievement_id".

### **POST** /api/users/:email/decks
- Crea un mazo nuevo asociado al usuario. Devuelve error si incluye alguna carta ilegal/no conseguida.
- Body: "deck_name" y "cards".

### **DELETE** /api/users/:email/decks/:deck-id
- Borra, si posible, el mazo del usuario.

### **DELETE** /api/users/:email/friends/:friendUsername
- Elimina a un usuario de la lista de amigos de :email y el usuario correspondiente a :email del amigo borrado.
- Body: "friendUsername".

### **GET** /api/users/:email/cards
- Devuelve las cartas que tiene desbloqueadas el usuario.

### **GET** /api/users/:email/decks
- Devuelve todos los mazos y los nombres de las cartas que lo componen asociados al usuario.

### **GET** /api/users/:email/decks/:deck-id/cards
- Devuelve las cartas que componen un mazo, junto a toda la información acerca de estas.

### **GET** /api/users/:email/friends
- Devuelve la lista de amigos del usuario (SIN online/offline).

### **GET** /api/users/:email/icons
- Devuelve todos los iconos que el usuario tiene.

### **GET** /api/users/:email/invites
- Devuelve los usuarios que han invitado al usuario.

### **GET** /api/users/:email/matches
- Devuelve las partidas activas en las que está el usuario.

### **GET** /api/users/:email/pawns
- Devuelve todas las skins de fichas que tiene el usuario.

### **GET** /api/users/:email/profile
- Devuelve la información del perfil (icono, nombre, victorias, derrotas, monedas que tiene, skin actual de escalera, de serpiente y de ficha).

### **GET** /api/users/:email/SEP
- Devuelve los SEP que tiene el usuario como objeto con solo SEP

### **GET** /api/users/:email/snakes
- Devuelve todas las skins de serpientes que tiene el usuario.

### **GET** /api/users/:email/stairs
- Devuelve todas las skins de escaleras que tiene el usuario.

### **GET** /api/users/:email/stats
- Devuelve las estadísticas del jugador, así como los logros completados.

### **PUT** /api/users/:email/decks/:deck-id
- Modifica el mazo con deck-id asociado al usuario. Devuelve error si incluye alguna carta ilegal/no conseguida.
- Body: "deck_name" y "cards".

### **PUT** /api/users/:email/icon
- Actualiza el icono del usuario.
- Body: "icon".

### **PUT** /api/users/:email/pawn
- Actualiza la skin de ficha del usuario.
- Body: "pawn".

### **PUT** /api/users/:email/snake
- Actualiza la skin de serpiente del usuario.
- Body: "snake".

### **PUT** /api/users/:email/stair
- Actualiza la skin de escalera del usuario.
- Body: "stair".

### **PUT** /api/users/:email/username
- Actualiza el nombre del usuario.
- Body: "username".