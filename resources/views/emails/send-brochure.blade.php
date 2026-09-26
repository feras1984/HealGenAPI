<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Property Brochure</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #17212c;">
        <h1>Download Brochure</h1>

        <p>Hello {{ $name }},</p>

        <p>Thank you for your interest in our {{$type}} <strong>{{ $property }}</strong>.</p>

        <p>You can download the brochure using the link below or see the attached PDF:</p>

        <p>
            <a href="{{ $downloadUrl }}" style="
                    display: inline-block;
                    padding: 12px 20px;
                    background-color: #17212c;
                    color: #fff !important;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                ">
                Download Brochure
            </a>
        </p>

        <p>We remain at your disposal should you require any further information.</p>

        <p>Thanks,<br>
            <strong>{{ config('app.name') }}</strong>
        </p>
    </body>
</html>
