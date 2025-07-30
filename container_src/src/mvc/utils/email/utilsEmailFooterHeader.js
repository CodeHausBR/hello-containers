import {ImagensEmail} from "../../../assets/email/index.js";

const utilsEmailFooterHeader = class utilsEmailFooterHeader {
    static styles = `
        <head>
            <style>
                body {font-family: Arial, sans-serif;}
                h1 {font-size: 24px; color: #1e88e5; margin-bottom: 10px; text-align: justify;}
                h2 {font-size: 14px; color: #333333; margin-bottom: 10px; text-align: justify;}
                h3 {font-size: 16px; color: #2c2c2c; margin-bottom: 10px; text-align: justify;}
                h4 {font-size: 24px; color: #ff6961; margin-bottom: 15px; text-align: justify;}
                h5 {font-size: 24px; color: #008000; margin-bottom: 15px; text-align: justify;}
                h6 {font-size: 24px; color: #fd7937; margin-bottom: 15px; text-align: justify;}
                h7 {font-size: 12px; color: #1e88e5; margin-bottom: 15px; text-align: justify;}
                div {}
                p {font-size: 16px;color: #333333;line-height: 1.3; text-align: justify;}
                a {color: #1e88e5;}
            </style>
        </head>
    `;

    static footerVistoria = `
        <div 
            style="
                background-image: url(${ImagensEmail.footer}); 
                background-size: contain;
                background-position: center; 
                justify-content: left;
                height: 160px; 
                max-width: 330px;
            ">
        </div>
    `;

    static header = `
    <div 
        style="
            background-image: url(${ImagensEmail.header}); 
            background-size: contain;
            background-position: center; 
            height: 145px; 
            max-width: 370px; 
            margin: 0 auto;
        ">
    </div>
`;
};

export default utilsEmailFooterHeader;
