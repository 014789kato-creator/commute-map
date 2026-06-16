export default function ContactPage() {
    return (
      <main
        style={{
          maxWidth: "600px",
          margin: "40px auto",
          padding: "20px",
        }}
      >
        <h1>お問い合わせ</h1>
  
        <p>
          ご意見・ご要望・不具合報告は
          以下フォームよりご連絡ください。
        </p>
  
        <form
          action="https://formspree.io/f/mqeonrrd"
          method="POST"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <input
            type="email"
            name="email"
            placeholder="メールアドレス"
            required
          />
  
          <textarea
            name="message"
            placeholder="お問い合わせ内容"
            rows={8}
            required
          />
  
          <button type="submit">
            送信
          </button>
        </form>
      </main>
    );
  }