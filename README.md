## RACETRACK - Websocket for TypeForSlack
**Requirements**

 - Node.js
 - Redis
 - docker

**Initial Setup**

 - Clone this repo
 - Move into the repo, and install the dependency using `npm install` command

**Setting up Redis and Server**

 - Download the redis docker file, using the `sudo docker run -p 6379:6379 redis` command 
 - The above command will download and run the redis in a docker.
 - Run `npm start` to start the server

**Socket Events**

 - **create/join event:** It basically allows a user to join a existing race track or creates a new racetrack and joins them to it
	 - **Request Object** : 
		```	
		     {room: hash, username: String<unique>}
		```    
	 - **Response Event** :
		 
		 - **USER_JOINED**:
        ```
		    { room: hash, userInTheRoom: Array of String}
        ```
		- **ALREADY_JOINED**:
        ```
		    "You have already joined the room!"
        ```
		 - **RACE_STARTED**:
        ```
		    "Race has already started"
        ```
 - **START_RACE :** This is emitted by the user who initiated the race, Once all the user have entered the race. This event is triggered. It provides with the para and closes the racetrack for new entries.
	 - **Request Object:**
        ```
		    {room: hash}
        ```
	 - **Response Event**:
		 -  **PARA**
        ```
		    '{id: Integer, taken_from: String, para: String}'
        ```
 - **TYPING**: This is emitted by the race users when they start tying the paragraph
	 - **Request Object**:
        ```
	        {username: String, WPM: Integer}
        ```
	 - **Response Event**:
		- **TYPING:**
        ```
		    {username: String, WPM: Integer}
        ```
- **DISCONNECTED**: This is listened in the client side to capture the response message when the user gets disconnected from the socket.
	- **Response Event**:
        ```
		    {username} has left the race
        ```