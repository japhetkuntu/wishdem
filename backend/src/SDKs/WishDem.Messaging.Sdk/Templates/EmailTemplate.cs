using System.Net;

namespace WishDem.Messaging.Sdk.Templates;

/// <summary>Shared branded HTML shell + a couple of reusable content blocks for every
/// outbound email. Deliberately table-based with everything styled inline rather than via
/// a &lt;style&gt; block or webfont — that's what actually survives being rendered by Gmail,
/// Outlook, and Apple Mail alike, which is worth more here than a fancier build. Callers
/// compose their own inner content (an <see cref="Eyebrow"/>, heading, paragraphs, a
/// <see cref="CodeBox"/> and/or <see cref="Button"/>) and pass it to <see cref="Shell"/>.</summary>
public static class EmailTemplate
{
    /// <summary>Wraps inner content in the branded header/body/footer shell. innerHtml is
    /// trusted markup built by the other helpers in this class — callers must still HTML-encode
    /// any raw user input (names, emails) themselves before interpolating it into paragraphs.
    /// The outer canvas is dark plum (matching the product's own dark theme) so the paper-white
    /// card reads like a real letter set down on a table, not a generic white email.</summary>
    public static string Shell(string preheaderText, string innerHtml)
    {
        return $$"""
            <!doctype html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <meta name="supported-color-schemes" content="light">
            <title></title>
            </head>
            <body style="margin:0;padding:0;background-color:#1B111D;font-family:'Manrope',Arial,sans-serif;">
              <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{{Encode(preheaderText)}}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1B111D;">
                <tr><td align="center" style="padding:48px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
                    <tr><td style="height:4px;line-height:4px;font-size:0;background-color:#E6C87A;border-radius:14px 14px 0 0;">&nbsp;</td></tr>
                    <tr><td style="background-color:#F6F0E8;border-radius:0 0 14px 14px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.45);">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr><td align="center" style="background-color:#2A1629;padding:34px 36px 30px;">
                          <span style="font-family:Georgia,'Playfair Display',serif;font-size:24px;font-weight:700;color:#F6F0E8;letter-spacing:-0.5px;">
                            Wish<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#E6C87A;margin:0 3px;"></span>Dem
                          </span>
                          <div style="margin-top:8px;font-size:9px;font-weight:800;letter-spacing:0.22em;color:rgba(230,200,122,0.75);text-transform:uppercase;">Private &amp; personal, always</div>
                        </td></tr>
                        <tr><td style="padding:44px 40px 40px;color:#241D24;font-size:14px;line-height:1.65;">
                          {{innerHtml}}
                        </td></tr>
                        <tr><td style="padding:22px 40px;background-color:#EFE7DA;border-top:1px solid rgba(42,22,41,0.08);">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-family:Georgia,'Playfair Display',serif;font-size:13px;font-weight:700;color:#4A203D;">
                                Wish<span style="display:inline-block;width:4px;height:4px;border-radius:50%;background-color:#4A203D;margin:0 2px;"></span>Dem
                              </td>
                              <td align="right" style="font-size:11px;line-height:1.6;color:rgba(36,29,36,0.5);">© {{DateTime.UtcNow.Year}} WishDem</td>
                            </tr>
                          </table>
                          <p style="margin:10px 0 0;font-size:11px;line-height:1.6;color:rgba(36,29,36,0.5);">A private wish, held until it matters. This is a one-time transactional email — you're receiving it because someone used this address on WishDem.</p>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }

    /// <summary>Small champagne uppercase label, used above a heading to set the tone
    /// before the reader even reaches the headline ("YOUR SIGN-IN CODE", "TEAM INVITE").</summary>
    public static string Eyebrow(string text)
    {
        return $"""
            <div style="margin:0 0 12px;font-size:10px;font-weight:800;letter-spacing:0.18em;color:#B8863F;text-transform:uppercase;">{Encode(text)}</div>
            """;
    }

    /// <summary>A large, evenly-spaced code display — used for OTP/reset codes, the one
    /// piece of every one of these emails a person actually needs to act on. Framed like a
    /// wax-stamped card rather than a plain box, with the code's own eyebrow + expiry note
    /// so it reads as a single self-contained unit even if the email client clips the rest.</summary>
    public static string CodeBox(string code, string? expiryNote = null)
    {
        var expiryHtml = expiryNote is null ? "" : $"""
            <div style="margin-top:10px;font-size:11px;color:rgba(42,22,41,0.55);">{Encode(expiryNote)}</div>
            """;
        return $"""
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0;">
              <tr><td align="center" style="padding:26px 20px;background-color:#FFFFFF;border:1px dashed rgba(184,134,63,0.55);border-radius:12px;">
                <div style="font-size:9px;font-weight:800;letter-spacing:0.2em;color:#B8863F;text-transform:uppercase;margin-bottom:12px;">Your code</div>
                <span style="font-family:Georgia,'Playfair Display',serif;font-size:36px;font-weight:700;letter-spacing:11px;color:#2A1629;">{Encode(code)}</span>
                {expiryHtml}
              </td></tr>
            </table>
            """;
    }

    /// <summary>A labeled key/value row — used for the invite email's "sign in with these"
    /// credentials block.</summary>
    public static string CredentialRow(string label, string value)
    {
        return $"""
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid rgba(42,22,41,0.08);font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#4A203D;">{Encode(label)}</td>
              <td style="padding:12px 0;border-bottom:1px solid rgba(42,22,41,0.08);font-size:14px;font-weight:700;color:#2A1629;text-align:right;font-family:'SFMono-Regular',Consolas,monospace;">{Encode(value)}</td>
            </tr>
            """;
    }

    public static string CredentialBox(string rowsHtml)
    {
        return $"""
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background-color:#FFFFFF;border:1px solid rgba(42,22,41,0.12);border-radius:12px;padding:6px 20px;">
              {rowsHtml}
            </table>
            """;
    }

    /// <summary>A solid champagne call-to-action button/link, table-wrapped for
    /// Outlook's rendering engine and centered so it reads as the one clear next step.</summary>
    public static string Button(string text, string url)
    {
        return $"""
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px auto 6px;">
              <tr><td align="center" style="background-color:#E6C87A;border-radius:999px;">
                <a href="{Encode(url)}" style="display:inline-block;color:#2A1629;font-weight:800;font-size:13px;text-decoration:none;padding:15px 30px;">{Encode(text)} &nbsp;→</a>
              </td></tr>
            </table>
            """;
    }

    /// <summary>A soft divider between two logical sections of the same email body — a
    /// dotted champagne rule rather than a hard line, matching the invite/reset framing.</summary>
    public static string Divider()
    {
        return """
            <div style="margin:28px 0;border-top:1px dashed rgba(42,22,41,0.16);"></div>
            """;
    }

    /// <summary>HTML-encodes user-supplied or dynamic text before it's interpolated into
    /// markup — every helper above already does this for its own inputs, but call sites
    /// building their own paragraphs (names, emails) should reach for this too.</summary>
    public static string Encode(string text) => WebUtility.HtmlEncode(text);
}
