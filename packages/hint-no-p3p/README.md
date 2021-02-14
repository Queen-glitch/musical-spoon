# No `P3P` headers (`no-p3p`)

`no-p3p` disallows the use of `P3P` in any form (headers, `rel`
attribute, and `well-known` location).

## Why is this important?

[P3P][p3p spec] (Platform for Privacy Preferences Project) is
a deprecated technology meant to allow browsers to programmatically
check privacy policies.

Microsoft Internet Explorer was the most popular browser that
implemented `P3P`. With Windows 10, `P3P`'s support was removed
entirely from Internet Explorer 11 and has [minimal servicing
for other versions of Windows][p3p not supported]. Other popular
browsers never implemented or removed this feature before Microsoft
did.

On top of the lack of support, if the header is sent and it's not
kept in sync with normal human-readable privacy policies, it may be
a cause of legal confusion, which might present legal risks. Please
check with a local lawyer to see if that's the case in your country.

Additionally, [studies][research] have detected that about 33% of
sites using P3P don't have a valid configuration. In some cases,
the value was used to circumvent Internet Explorer cookie blocking
(and thus rendering P3P ineffective). Others had typos and errors
in the tokens.

Because of all the above reasons it's recommended to not use `P3P`
anymore.

One thing to keep in mind if you need to support old versions of
Internet Explorer is that:

> By default, Internet Explorer will reject cookies coming from
3rd-party contexts. A 3rd-party context is one where the domain
on the content is different than the domain of the page that pulls
in that content. Possible third-party contexts include pretty much
any element that accepts a URL: `<script>`, `<img>`, `<link>`,
`<frame>`, `<iframe>`, `<audio>`, `<video>`, et cetera. It also
includes cross-domain `XMLHttpRequest` which attempt to send
cookies when the `withCredentials` flag is set.

*[A Quick Look at P3P (Eric Lawrence)][quick look]*

## What does the hint check?

There are 3 ways in which a site can define the `P3P` policy:

* [`well-known` location][well-known]
* [`P3P` HTTP header][p3p header]
* HTML link tag and [`rel="P3Pv1"` attribute][p3p link]

This hint checks that a site doesn't use any of these.

### Examples that **trigger** the hint

Note: the following examples are case-insensitive.

The `P3P` header is sent:

```text
HTTP/... 200 OK

...
p3p: CP="NON DSP COR CURa PSA PSD OUR BUS NAV STA"
...
```

The `P3P` header is sent with non-P3P contents:

```text
HTTP/... 200 OK

...
p3p: <Random or empty value>
...
```

There is a `link` tag with `rel="P3Pv1"`:

```html
...
<link rel="P3Pv1" href="/p3p.xml">
...
```

The server responds to `/w3c/p3p.xml` with any content:

```text
HTTP/... 200 OK

...
```

### Examples that **pass** the hint

The `P3P` header is not sent:

```text
HTTP/... 200 OK

Content-Type: text/html; charset=utf-8
...
```

There isn't any `<link rel="P3Pv1">` in the HTML.

The server doesn't have content in `/w3c/p3p.xml`:

```text
HTTP/... 404 OK

...
```

## How to use this hint?

This package is installed automatically by webhint:

```bash
npm install hint --save-dev
```

To use it, activate it via the [`.hintrc`][hintrc] configuration file:

```json
{
    "connector": {...},
    "formatters": [...],
    "hints": {
        "no-p3p": "error",
        ...
    }
    ...
}
```

**Note**: The recommended way of running webhint is as a `devDependency` of
your project.

## Further Reading

* [Quick look at P3P][quick look]
* [Wikipedia's P3P page][wikipedia]

<!-- Link labels -->

[hintrc]: https://webhint.io/docs/user-guide/configuring-webhint/summary/
[p3p header]: https://www.w3.org/TR/P3P11/#syntax_ext
[p3p link]: https://www.w3.org/TR/P3P11/#syntax_link
[p3p spec]: https://www.w3.org/TR/P3P11/
[p3p not supported]: https://msdn.microsoft.com/en-us/library/dn904497.aspx#Platform_for_Privacy_Preferences_1.0__P3P_1.0__removal
[quick look]: https://blogs.msdn.microsoft.com/ieinternals/2013/09/17/a-quick-look-at-p3p/
[research]: https://www.cylab.cmu.edu/_files/pdfs/tech_reports/CMUCyLab10014.pdf
[support]: https://en.wikipedia.org/wiki/P3P#User_agent_support
[well-known]: https://www.w3.org/TR/P3P11/#Well_Known_Location
[wikipedia]: https://en.wikipedia.org/wiki/P3P#User_agent_support
