# En este md se explica las diferentes discusiones de implementación surgidas durante el desarrollo de esta fase.

### 1- Partidas

1.1- Lobbies: Los lobbies se representarán sólo en memoria, es decir, no habrá una entidad concerta en la base de datos. Una vez se elige el lobby y se comienza la partida, ya quedará perfectamente instanciada en la base de datos.

1.1.1- Un jugador solo podrá estar en una lobby a la vez, sin embargo, una vez comience una partida, este sí puede unirse o crear un lobby para jugar otra partida.

1.1.2- A una lobby se pueden unir tanto jugadores reales como bots, los cuales serán añadidos exclusivamente por el líder de dicho lobby.

1.1.2.1- A los bots se les asignará automáticamente un mazo por defecto llamado "mazoPorDefecto".

1.2- Número máximo de partidas: Un jugador podrá estar, como máximo, en 10 partidas simultáneas.

1.3- Restricciones de mazos en partidas diferentes: El mazo se seleccionará dentro del menú de cada partida, es decir, no tendrá un único mazo "activo". Podrá tener varias partidas iniciadas con distintos mazos, pero no podrá modificar ni eliminar mazos de partidas que se están jugando en ese momento, ni cambiar de mazo en esa partida.

1.4- Representación estado: El estado tanto de la partida como de los jugadores como del tablero de la partida quedarán guardados en la base de datos mediante un fichero .json, manteniéndose actualizando durante el transcurso de la partida.

1.5- En cada turno, un jugador tendrá, como mucho, 4 cartas en su mano disponibles para poder ser jugadas en ese turno.

1.6- Finalización/Llegada a meta: Una ficha acaba la partida cuando en su turno al lanzar el dado el número coincide exactamente con la distancia que falta para la llegada a meta. Si saca un número mayor, dicha ficha se irá hacía atrás el número correspondiente de casillas.

1.7- Bloqueos: Los bloqueos se producirán cuando en una misma casilla hay dos fichas de cualquier jugador. Un bloqueo puede ser saltado por una ficha si el usuario usa una carta de salto de casilla. El bloqueo se romperá cuando el usuario quiera mover voluntariamente una ficha de ese bloqueo o cuando saque en una tirada un 6, momento en el cual la ficha movida será la que conforma el bloqueo. 

1.8- En el lobby se verá primeramente el nombre de un tablero predefinido, el cual podrá ser cambiado en el menú antes de iniciar la partida.

1.8.1 - El tablero mostrado en el lobby será el mismo que el de la partida, sin embargo se mostrará una imagen estática del mismo.

1.8.2 - El tablero que se vaya a jugar solo será visto por el líder.

1.9 - Todos los usuarios de la partida deberán seleccionar un mazo que tengan creado antes de poder empezar la partida. 
