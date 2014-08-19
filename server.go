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

func main() {
  r := mux.NewRouter()
  r.HandleFunc("/xhr", handleXHR)
  r.HandleFunc("/ws", handleWS)
  r.PathPrefix("/").Handler(
    http.FileServer(http.Dir("./public/")),
  )
  port := os.Getenv("PORT")
  if port == "" {
    port = "8080"
  }
  fmt.Printf("listening on %s\n", port)
  http.ListenAndServe(":" + port, r)
}

func handleXHR(w http.ResponseWriter, r *http.Request) {
  if r.FormValue("delay") == "1" {
    time.Sleep(100 * time.Millisecond)
  }
  response, _ := json.Marshal(WebResponse{time.Now()})
  w.Write(response)
}

type WebResponse struct {
  Now time.Time `json:"now"`
}

var upgrader = websocket.Upgrader{
  ReadBufferSize:  1024,
  WriteBufferSize: 1024,
}

func handleWS(w http.ResponseWriter, r *http.Request) {
  conn, err := upgrader.Upgrade(w, r, nil)
  if err != nil {
    return
  }
  writes := make(chan WSResponse)
  go respondWS(conn, writes)
  for {
    message := WSRequest{}
    err := conn.ReadJSON(&message)
    if err != nil {
      close(writes)
      return
    }
    go message.respond(writes)
  }
}

func respondWS(conn *websocket.Conn,
  writes chan WSResponse) {
    for {
      content, more := <-writes
      conn.WriteJSON(content)
      if !more {
        return
      }
    }
}

type WSRequest struct {
  Id int `json:id`
  Delay bool `json:delay`
}
func (request *WSRequest) respond(
  writes chan WSResponse) {
    if request.Delay {
      time.Sleep(100 * time.Millisecond)
    }
    response := WSResponse{time.Now(), request.Id}
    writes <- response
}

type WSResponse struct {
  Now time.Time `json:"now"`
  Id int `json:"id"`
}
