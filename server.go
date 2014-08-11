package main

import (
  "net/http"
  "github.com/gorilla/mux"
  "github.com/gorilla/websocket"
  "time"
  "encoding/json"
  "fmt"
  "os"
)

type WebResponse struct {
  Now time.Time `json:"now"`
}

func (this *WebResponse) toJson () []byte  {
  b, _ := json.Marshal(this)
  return b
}

func handleXhr(w http.ResponseWriter, r *http.Request) {
  if r.FormValue("delay") == "1" {
    time.Sleep(time.Second)
  }
  response := WebResponse{time.Now()}
  w.Write(response.toJson())
}

type WebServiceMessage struct {
  Id int `json:id`
  Delay bool `json:delay`
}

func (this *WebServiceMessage) respondToMessage(writes chan WSResponse) {
  if this.Delay {
    time.Sleep(time.Second);
  }
  response := WSResponse{time.Now(), this.Id}
  writes <- response
}

type WSResponse struct {
  Now time.Time `json:"now"`
  Id int `json:"id"`
}

var upgrader = websocket.Upgrader{
  ReadBufferSize:  1024,
  WriteBufferSize: 1024,
}

func handlerWS(w http.ResponseWriter, r *http.Request) {
  conn, err := upgrader.Upgrade(w, r, nil)
  if err != nil {
      return
  }
  writes := make(chan WSResponse)
  go listenWrites(conn, writes)
  for {
    message := WebServiceMessage{}
    err := conn.ReadJSON(&message)
    if err != nil {
      close(writes)
      return
    }
    go message.respondToMessage(writes)
  }
}

func listenWrites(conn *websocket.Conn, writes chan WSResponse) {
  for {
    content, more := <-writes
    conn.WriteJSON(content)
    if !more {
      return
    }
  }
}

func main() {
  port := os.Getenv("PORT")
  if port == "" {
    port = "8080"
  }
  r := mux.NewRouter()
  r.HandleFunc("/xhr", handleXhr)
  r.HandleFunc("/ws", handlerWS)
  r.PathPrefix("/").Handler(http.FileServer(http.Dir("./public/")))
  fmt.Printf("listening on %s\n", port)
  http.ListenAndServe(":" + port, r)
}
