import fetch from 'node-fetch';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const upstream = 'nyaa.si'

const base_url = 'https://nyaa.si'

const upstream_path = '/'

const replace_dict = {
    '$upstream': '$custom_domain',
    '//nyaa.si': '//api-cdn.kev1n.top'
}

async function fetchAndApply(request, response) {
    let url = new URL(request.url, base_url);
    let url_hostname = url.hostname;

    url.protocol = 'https:';

    var upstream_domain = upstream;

    url.host = upstream_domain;
    if (url.pathname == '/') {
        url.pathname = upstream_path;
    } else {
        url.pathname = upstream_path + url.pathname;
    }
        let method = request.method;
        let request_headers = request.headers;

        request_headers['host']= url.hostname;
        request_headers['referer'] = url.hostname;

        let original_response = await fetch(url.href, {
            method: method,
            headers: request_headers
        })

        let original_text;
        let status = original_response.status;
        let content_type = original_response.headers.get("content-type");
        response.setHeader("content-type", content_type);
        let redirect;

        if(content_type.indexOf("application/xml") !== -1){
            original_text = await replace_response_text(original_response, upstream_domain, url_hostname);
        } else if(content_type.indexOf("image") !== -1){
            redirect = true;
        } else {
            original_text = await original_response.text()
        }

    
    return {
        body:original_text,
        resp: response,
        status: status,
        redirect: redirect,
        url: url
    };
}

async function replace_response_text(response, upstream_domain, host_name) {
    let text = await response.text()
    host_name = 'api-cdn.kev1n.top'
    var i, j;
    for (i in replace_dict) {
        j = replace_dict[i]
        if (i == '$upstream') {
            i = upstream_domain
        } else if (i == '$custom_domain') {
            i = host_name
        }

        if (j == '$upstream') {
            j = upstream_domain
        } else if (j == '$custom_domain') {
            j = host_name
        }

        let re = new RegExp(i, 'g')
        text = text.replace(re, j);
    }
    return text;
}


export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
    let {resp, body, redirect, url} =  await fetchAndApply(request, response);
    if(redirect){
        return resp.redirect(url.href);
    }
    return resp.send(body);
}