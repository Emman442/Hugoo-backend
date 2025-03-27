import cloudinary from "cloudinary"
export const uploadFile = async (file: any) => {
    const upload_url = await cloudinary.v2.uploader.upload(file)
    console.log("upload_url: ", upload_url);
    console.log(upload_url)
    return upload_url
}