# Arrival Scene Art Notes

This folder stores the approved arrival-page visual reference.

## Files

- `arrival-standard-reference.png`: approved arrival-page reference background, copied from `demo/public/assets/reference/arrival-standard.png`.

## Usage

Use this image as the visual source of truth for the arrival page. Do not replace it with simplified pixel art, flat vector redraws, or newly imagined kitchen backgrounds.

If the frontend team needs layered implementation later, split elements from this reference image only:

- top bar
- left guest ticket frame
- kitchen background
- chef/customer area
- right request panel frame
- bottom navigation frame

Variable text, guest names, buttons, and runtime UI state should stay in React, not baked into new art exports.

## Related Assets

- Guests: `assets/art-library/characters/guests/`
- Guest avatars: `assets/art-library/characters/guests/avatars/`
- Pot mascot states: `assets/art-library/ui/pot-kun/`
- Original pot IP source: `assets/art-library/ui/title-kit/pot-mark.png`
