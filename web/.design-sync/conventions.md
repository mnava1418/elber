## Using the Elber design system

**No provider needed.** Every component (`Button`, `Card`, `GradientText`, `Logo`, `TextField`) is self-contained — no context, theme, or router wrapper required. Import directly from `'web'` and render.

### Styling idiom: CSS custom properties

Elber has no utility-class system and no style props. All visual language comes from CSS custom properties defined in the bundled stylesheet and consumed by the components' own classes. When building your own layout/glue markup around these components (containers, spacing, backgrounds), use the same tokens via `style={{ background: 'var(--bg)' }}` or your own CSS — never hardcode colors.

Brand palette:
- `--elber-primary` (#103b4a navy) · `--elber-secondary` (#087f8c teal) · `--elber-cyan` (#37d6d0) · `--elber-mint` (#d5fff8) · `--elber-orange` (#ff8b24)

Semantic tokens (light/dark aware, swap automatically with `prefers-color-scheme`):
- `--bg`, `--surface` — page and card backgrounds
- `--text`, `--text-h` — body text / heading text
- `--border` — hairline borders
- `--accent`, `--accent-bg` — focus rings, hover states
- `--on-brand` — text color to use on top of `--brand-gradient`
- `--brand-gradient` — the cyan→orange brand gradient (used by `Button` primary and `GradientText`)
- `--shadow` — elevation for cards/buttons
- `--sans`, `--mono` — font stacks

### Where the truth lives

Read `styles.css` (it `@import`s `_ds_bundle.css`, which holds every token and component class) before styling anything. Each component's `.prompt.md` documents its exact props.

### Component notes

- `Button` — polymorphic: pass `as={Link}` (or any element/component) to render as something other than `<button>`. `variant`: `primary` | `ghost`. `size`: `md` | `lg`.
- `Logo` — `size`: `sm` | `md` | `lg`; `withWordmark` toggles the "Elber" text next to the flame mark.
- `TextField` — labeled input; pass `label` plus any native `<input>` prop.
- `GradientText` — wraps inline/block text in the brand gradient; polymorphic via `as`.

### Idiomatic composition

```tsx
import { Button, Card, Logo, TextField } from 'web'

function LoginCard() {
  return (
    <Card style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Logo size="md" />
      <TextField label="Correo electrónico" type="email" placeholder="tu@correo.com" />
      <TextField label="Contraseña" type="password" placeholder="••••••••" />
      <Button type="submit" variant="primary">
        Iniciar sesión
      </Button>
    </Card>
  )
}
```
