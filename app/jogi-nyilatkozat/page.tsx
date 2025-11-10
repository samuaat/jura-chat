// app/jogi-nyilatkozat/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Jogi nyilatkozat – JURA",
  description:
    "Jogi nyilatkozat a JURA kísérleti jogi AI-asszisztens használatához. A szolgáltatás nem minősül jogi tanácsadásnak, nem hoz létre ügyvéd–ügyfél viszonyt, és nem érinti a felhasználó jogszabályban biztosított jogait.",
};

export default function JogiNyilatkozatPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pb-20 lg:pt-16">
        {/* Breadcrumb / vissza link */}
        <div className="mb-6 text-sm text-slate-600">
          <Link
            href="/"
            className="underline-offset-4 hover:text-slate-900 hover:underline"
          >
            ← Vissza a főoldalra
          </Link>
        </div>

        {/* Cím + bevezető */}
        <header className="mb-6">
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Jogi nyilatkozat
          </h1>
          <p className="text-sm text-slate-600">Utolsó frissítés: {today}</p>
        </header>

        {/* Összefoglaló box – köznyelvi */}
        <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="mb-1 font-semibold">Összefoglaló, közérthetően</p>
          <p className="leading-relaxed">
            A JURA egy <strong>kísérleti jogi AI-asszisztens</strong>, amely
            jogi információk és magyarázatok megkeresésében segít. Nem ügyvéd,
            nem ad végleges jogi tanácsot, nem lát el jogi képviseletet, és nem
            szerkeszt vagy ellenjegyez okiratot. A válaszok{" "}
            <strong>tájékoztató jellegűek</strong>, amelyek pontosságáért és
            teljességéért csak a jogszabályok által megengedett legteljesebb
            mértékben vállalható felelősség. A felhasználó jogszabályban
            biztosított jogai és jogorvoslati lehetőségei{" "}
            <strong>nem korlátozhatók</strong> jelen nyilatkozattal.
          </p>
        </section>

        <div className="space-y-6 text-sm leading-relaxed text-slate-800">
          {/* 1. A szolgáltatás jellege */}
          <section>
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              1. A szolgáltatás jellege
            </h2>
            <p className="mb-2">
              A JURA egy mesterséges intelligencia alapú, kísérleti
              információs eszköz, amely magyar jogszabályok és jogi szövegek
              kiválasztott köre alapján segít a{" "}
              <strong>szakaszok, jogintézmények és jogesetek</strong> jobb
              megértésében. A rendszer célja, hogy támogassa a{" "}
              <strong>tájékozódást és az előzetes információkeresést</strong>,
              nem pedig az, hogy szakmai jogi álláspontot vagy végleges
              megoldási javaslatot adjon.
            </p>
            <p>
              A JURA elsősorban{" "}
              <strong>oktatási, kutatási és tájékoztató</strong> célokat
              szolgál, és nem minősül ügyvédi vagy más jogi szolgáltatásnak.
            </p>
          </section>

          {/* 2. Nem minősül jogi tanácsadásnak / ügyvédi tevékenységnek */}
          <section>
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              2. Nem minősül jogi tanácsadásnak vagy ügyvédi tevékenységnek
            </h2>
            <p className="mb-2">
              A JURA által adott válaszok, összefoglalók, hivatkozások és
              szövegjavaslatok <strong>nem minősülnek jogi tanácsadásnak</strong>.
              A rendszer nem képes figyelembe venni az egyes ügyek minden
              releváns körülményét, ezért az általa generált tartalom{" "}
              <strong>nem tekinthető személyre szabott jogi véleménynek</strong>.
            </p>
            <p className="mb-2">
              A JURA<em> különösen nem végez</em>:
            </p>
            <ul className="mb-2 ml-5 list-disc space-y-1">
              <li>jogi tanácsadást egyedi ügyekre vonatkozóan,</li>
              <li>jogi képviseletet bíróság vagy hatóság előtt,</li>
              <li>okiratszerkesztést vagy okirat ellenjegyzését,</li>
              <li>
                olyan tevékenységet, amely az ügyvédi tevékenységről szóló
                jogszabály alapján kifejezetten ügyvédi tevékenységnek minősül.
              </li>
            </ul>
            <p>
              Konkrét jogvita, peres vagy hatósági eljárás, illetve bármely
              jelentős jogi következménnyel járó döntés előtt minden esetben{" "}
              <strong>hivatásos jogi szakember (pl. ügyvéd) felkeresése
              szükséges</strong>.
            </p>
          </section>

          {/* 3. Ügyvéd–ügyfél viszony hiánya és titokvédelem */}
          <section>
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              3. Ügyvéd–ügyfél viszony hiánya és titokvédelem
            </h2>
            <p className="mb-2">
              A JURA használata <strong>nem hoz létre ügyvéd–ügyfél
              viszonyt</strong>, és nem alapoz meg semmilyen szerződéses vagy
              megbízási jogviszonyt a felhasználó és a rendszer üzemeltetője
              között.
            </p>
            <p className="mb-2">
              A rendszerben megadott kérdések, leírt tényállások vagy egyéb
              információk <strong>nem esnek ügyvédi titok alá</strong>. Az
              ügyvédi titoktartási kötelezettség az ügyvédi tevékenységet
              gyakorló személyt terheli; a JURA nem ilyen minőségben jár el.
            </p>
            <p>
              A felhasználó ezért köteles különös körültekintéssel eljárni
              akkor, ha érzékeny, bizalmas vagy harmadik személy(ek)re
              vonatkozó adatokat ad meg a rendszer számára.
            </p>
          </section>

          {/* 4. Pontosság, teljesség, naprakészség */}
          <section>
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              4. Pontosság, teljesség és naprakészség
            </h2>
            <p className="mb-2">
              Bár törekszünk arra, hogy a JURA által felhasznált joganyagok és
              magyarázatok <strong>relevánsak és korszerűek</strong> legyenek,
              a rendszer által adott válaszok pontossága, teljessége és
              naprakészsége <strong>nem garantálható</strong>.
            </p>
            <p className="mb-2">
              A jogszabályok időről időre módosulnak, hatályukat veszíthetik,
              illetve új rendelkezések léphetnek hatályba. A JURA válaszai{" "}
              <strong>nem feltétlenül tükrözik a jog aktuális állapotát</strong>,
              ezért minden esetben javasolt a hivatkozott szövegek{" "}
              <strong>hiteles forrásból</strong> való ellenőrzése.
            </p>
            <p>
              A rendszer által idézett vagy parafrazeált jogszabályi
              rendelkezések <strong>nem minősülnek hiteles jogszabály-közlésnek</strong>.
            </p>
          </section>

          {/* 5. Felelősség kizárása – jogszabály-kímélő módosítással */}
          <section>
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              5. Felelősség kizárása
            </h2>
            <p className="mb-2">
              A JURA használatából eredő bármilyen döntés, mulasztás vagy
              jogügylet – ideértve különösen jogviták kimenetelét, hatósági
              eljárások eredményét, határidők elmulasztását vagy szerződések
              megkötését – <strong>a felhasználó saját felelősségére</strong>{" "}
              történik.
            </p>
            <p className="mb-2">
              A rendszer üzemeltetője és fejlesztője a jogszabályok által
              megengedett <strong>legteljesebb mértékben kizár minden
              felelősséget</strong> a JURA használatából eredő károkért,
              különösen a pontatlan, hiányos vagy félreértelmezett
              információk alapján hozott döntések következményeiért.
            </p>
            <p>
              A jelen felelősségkizárás{" "}
              <strong>nem érinti a jogszabály által nem kizárható
              felelősséget</strong>, így különösen nem érinti a kötelező
              fogyasztóvédelmi rendelkezésekből eredő jogokat és
              jogorvoslati lehetőségeket, valamint a szándékosan okozott kárért
              való felelősséget.
            </p>
          </section>

          {/* 6. A felhasználó kötelezettségei */}
          <section>
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              6. A felhasználó kötelezettségei
            </h2>
            <p className="mb-2">
              A felhasználó köteles a JURA által adott válaszokat{" "}
              <strong>kritikusan értékelni</strong>, azokat más forrásokkal
              összevetni, és szükség esetén <strong>jogi szakember
              véleményét kérni</strong>.
            </p>
            <p>
              A felhasználó különösen köteles tartózkodni attól, hogy a
              rendszer válaszait <strong>önmagukban, ellenőrzés nélkül</strong>{" "}
              használja fel olyan döntések meghozatalához, amelyek jelentős
              jogi, pénzügyi vagy személyes következményekkel járhatnak.
            </p>
          </section>

          {/* 7. A nyilatkozat módosítása és közzététele */}
          <section>
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              7. A jogi nyilatkozat módosítása
            </h2>
            <p className="mb-2">
              Fenntartjuk a jogot arra, hogy jelen jogi nyilatkozat tartalmát
              a jövőben módosítsuk, különösen akkor, ha a jogszabályi
              környezet vagy a JURA működése érdemben megváltozik.
            </p>
            <p>
              A módosítások a <strong>honlapon való közzététellel</strong> válnak
              hatályossá. Amennyiben a módosítás a felhasználók jogait vagy
              kötelezettségeit lényegesen érinti, azt a körülményekhez képest
              <strong> észszerű időn belül és átlátható módon</strong> jelezzük
              (pl. kiemelt felületi értesítéssel). A szolgáltatás további
              használata a módosított nyilatkozat elfogadását jelenti.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
