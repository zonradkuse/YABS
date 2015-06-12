# YABS Image Upload API 
**clamdscan (or clamscan - take a look into config.js) will be needed** or virus checking will be disabled.

**every server answer is application/json**

## Request

**POST** Request to `/upload`. Only one file at once is accepted.  
    
    encoding-type: multipart/form-data, //multer module needs this
    fieldName: image 

### Example HTML form:

    <form action="/upload" method="post" enctype="multipart/form-data">
        File:
        <input type="file" name="image" value="Your File..."> 
        <input type="submit" value="Submit"> 
    </form>

## Possible Errors

    {error: "No image attached."}
    {error: "Mimetype " + file.mimetype + " is not supported"}
    {error: "You are not logged in."}
    {error : "Filesize limit exceeded."}
    {error: "Virus detected.", message: "This incident has been reported."}
    {error : "Wrong Field"}
    {error: "An error occured on processing the image"}
    {error: "Could not save new Image"}
    
## Success

The server response will be a an instance of the image model as saved to the database. You will need the `_id` for your questions ans answers.

# YABS Image Model

    {
      _id: String,
      creationTime: {
          type: Date,
          default: Date.now
      },
      updateTime: {
          type: Date,
          default: Date.now
      },
      path: String, //this is the relative path to the image. for example /userimages/asd.jpg
      type: String, //filetype by extension
      resolution: {
          width: Number, 
          height: Number
      },
      size: Number, //filesize of the original file - **deprecated**
      visible: {
          type: Boolean,
          default: true
      }
    }