using System.Net;

namespace WishDem.Messaging.Sdk.Templates;

/// <summary>Shared branded HTML shell + a couple of reusable content blocks for every
/// outbound email. Deliberately table-based with everything styled inline rather than via
/// a &lt;style&gt; block or webfont — that's what actually survives being rendered by Gmail,
/// Outlook, and Apple Mail alike, which is worth more here than a fancier build. Callers
/// compose their own inner content (heading, paragraphs, a <see cref="CodeBox"/> and/or
/// <see cref="Button"/>) and pass it to <see cref="Shell"/>.</summary>
public static class EmailTemplate
{
    /// <summary>Wraps inner content in the branded header/body/footer shell. innerHtml is
    /// trusted markup built by the other helpers in this class — callers must still HTML-encode
    /// any raw user input (names, emails) themselves before interpolating it into paragraphs.</summary>
    public static string Shell(string preheaderText, string innerHtml)
    {
        return $$"""
            <!doctype html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <title></title>
            </head>
            <body style="margin:0;padding:0;background-color:#F1ECE4;font-family:'Manrope',Arial,sans-serif;">
              <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{{Encode(preheaderText)}}</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1ECE4;">
                <tr><td align="center" style="padding:32px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#F6F0E8;border-radius:14px;overflow:hidden;">
                    <tr><td style="background-color:#2A1629;padding:26px 36px;">
                      <span style="font-family:Georgia,'Playfair Display',serif;font-size:22px;font-weight:700;color:#F6F0E8;letter-spacing:-0.5px;">
                        Wish<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#E6C87A;margin:0 3px;"></span>Dem
                      </span>
                    </td></tr>
                    <tr><td style="padding:40px 36px;color:#241D24;font-size:14px;line-height:1.6;">
                      {{innerHtml}}
                    </td></tr>
                    <tr><td style="padding:18px 36px;background-color:#EFE7DA;border-top:1px solid rgba(42,22,41,0.08);">
                      <p style="margin:0;font-size:11px;line-height:1.6;color:rgba(36,29,36,0.55);">© {{DateTime.UtcNow.Year}} WishDem · Private by design</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }

    /// <summary>A large, evenly-spaced code display — used for OTP/reset codes, the one
    /// piece of every one of these emails a person actually needs to act on.</summary>
    public static string CodeBox(string code)
    {
        return $"""
            <div style="margin:24px 0;padding:22px;background-color:#FFFFFF;border:1px solid rgba(42,22,41,0.12);border-radius:10px;text-align:center;">
              <span style="font-family:Georgia,'Playfair Display',serif;font-size:34px;font-weight:700;letter-spacing:10px;color:#2A1629;">{Encode(code)}</span>
            </div>
            """;
    }

    /// <summary>A labeled key/value row — used for the invite email's "sign in with these"
    /// credentials block.</summary>
    public static string CredentialRow(string label, string value)
    {
        return $"""
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(42,22,41,0.08);font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#4A203D;">{Encode(label)}</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(42,22,41,0.08);font-size:14px;font-weight:700;color:#2A1629;text-align:right;font-family:'SFMono-Regular',Consolas,monospace;">{Encode(value)}</td>
            </tr>
            """;
    }

    public static string CredentialBox(string rowsHtml)
    {
        return $"""
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:#FFFFFF;border:1px solid rgba(42,22,41,0.12);border-radius:10px;padding:6px 18px;">
              {rowsHtml}
            </table>
            """;
    }

    /// <summary>A solid champagne call-to-action button/link.</summary>
    public static string Button(string text, string url)
    {
        return $"""
            <div style="margin:28px 0 8px;">
              <a href="{Encode(url)}" style="display:inline-block;background-color:#E6C87A;color:#2A1629;font-weight:800;font-size:13px;text-decoration:none;padding:13px 26px;border-radius:999px;">{Encode(text)}</a>
            </div>
            """;
    }

    /// <summary>HTML-encodes user-supplied or dynamic text before it's interpolated into
    /// markup — every helper above already does this for its own inputs, but call sites
    /// building their own paragraphs (names, emails) should reach for this too.</summary>
    public static string Encode(string text) => WebUtility.HtmlEncode(text);
}
