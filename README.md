![The Mountain is Out!](http://i.imgur.com/f3aZZI9.png)

# themtn.top CLI
A simple CLI to answer a simple - yet important - question: "Is the mountain out?"

### How to use
Open up your favorite terminal and do one of the following:

Using `curl`
```curl
curl themtn.top
```
```curl
curl https://themtn.top
```
Using `powershell`
```powershell
(Invoke-WebRequest -Uri themtn.top).Content
```
```powershell
(Invoke-WebRequest -Uri https://themtn.top).Content
```

### What Mountain?
If you're not from Seattle and don't know what I mean by Mountain, this is what I'm talking about!:

![The Mountain is Out!](http://media-cache-ec0.pinimg.com/736x/32/0d/cd/320dcdbdcb002671cd13b0641e3cfbe5.jpg)

Mt. Rainier it all its glory!

### As an API
While the requests are low, there's an open API endpoint available at `/api`:

```powershell
(Invoke-WebRequest -Uri https://themtn.top/api).Content
```
gets you:
```json
{
  "result":true,
  "image":"https://ismtrainierout.com/timelapse/2017_06_19/1550.jpg"
}
```

There's an even simpler version of the API at `/api/simple` that return status code `200 OK` if it's out or `404 Not Found` if it's not.

### Current Usage

Here are a list of projects that currently use this API:

* [Mt. Rainier Alexa Skill](https://www.amazon.com/Tyler-Leonhardt-Mt-Rainier/dp/B072KGC5B1/ref=sr_1_1?s=digital-skills&ie=UTF8&qid=1497914199&sr=1-1&keywords=Mt+Rainier)
* [Bync cube effects](https://github.com/mtntop/isthemountainout-blync)
* [Mt. Rainier Bot Framework Bot](https://github.com/mtntop/mtnbot)
