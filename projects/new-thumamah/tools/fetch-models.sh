#!/usr/bin/env bash
# ينزّل نماذج نيو ثمامة الاثنين والثلاثين بأسمائها الصحيحة مباشرة إلى assets/models.
# شغّله من جذر المشروع:  bash tools/fetch-models.sh
# ملاحظة: الروابط عامة لكنها مؤقتة نسبيًا — إن انتهت صلاحيتها أعِد توليد الروابط.
set -u
B=https://d8j0ntlcm91z4.cloudfront.net/user_2vXHpgEbsBHyI0PdTyrqG2LFUbp
OUT="$(dirname "$0")/../assets/models"
mkdir -p "$OUT"

get () {  # get <اسم الملف> <اسم المصدر>
  printf '%-24s' "$1"
  if curl -fsSL --retry 3 --retry-delay 2 -o "$OUT/$1" "$B/$2"; then
    printf 'تم  (%s ك.ب)\n' "$(( $(wc -c < "$OUT/$1") / 1024 ))"
  else
    printf 'فشل\n'
  fi
}

# الدفعة ١ — مباني هوية المشروع
get summit-restaurant.glb hf_20260913_164440_895e31cb-0d0d-456b-91be-c1571d3debb5.glb
get private-villa.glb     hf_20260913_164446_808d2030-3a0e-4c59-a557-d78f305897a5.glb
get stable-row.glb        hf_20260913_164452_aa7a40be-9a64-457e-8bae-95525d2e8d49.glb
get play-set.glb          hf_20260913_164458_6a03e063-df97-443b-8c54-c66026212748.glb
get admin-block.glb       hf_20260913_164504_4ede8e6d-6eed-4941-8b94-f68d72db008d.glb

# الدفعة ٢ — الناس والكشتة
get person-thobe.glb      hf_20260913_164718_b13623eb-f8e0-42aa-a2e9-df58308b1002.glb
get person-abaya.glb      hf_20260913_164724_18cd7dea-9451-4cef-9777-72ee4dfe91f3.glb
get person-child.glb      hf_20260913_164730_1b3258c5-52a3-4aaa-9d7c-d573879ab5e9.glb
get person-staff.glb      hf_20260913_164736_2e1fe2e0-58ba-445a-a822-ff6919b58da6.glb
get kashta.glb            hf_20260913_164742_c55a924c-582e-4345-8196-2d31e571e110.glb

# الدفعة ٣ — الخدمات والمظلات
get workshop.glb          hf_20260913_165532_7e2694a3-d04d-4a7b-a909-78e41a5d5565.glb
get grocery.glb           hf_20260913_165538_2ca70a16-6170-4f27-ad38-b2a131d82a18.glb
get tensile-canopy.glb    hf_20260913_165545_4ebf11c8-b0b7-491a-beda-84b79138090e.glb
get shade-structure.glb   hf_20260913_165552_29902070-be63-4d05-ba7d-0ffaa5f93d2c.glb
get camp-screen.glb       hf_20260913_165558_5c1140df-eaaa-419d-ba3e-537d4f9e1f60.glb

# الدفعة ٤ — مركبات وتفاصيل وتنويعات
get sedan.glb             hf_20260913_165249_a095c062-ad16-4f8a-9aa9-ed0d3d5c69df.glb
get suv.glb               hf_20260913_165256_b164fbae-d491-400d-80b0-0386d6385098.glb
get pickup.glb            hf_20260913_165305_7d58d12c-7e0b-4088-b07e-8073bd8e4f9a.glb
get coach.glb             hf_20260913_165313_94459e6c-086b-4005-9015-92b8a8b86d79.glb
get off-roader.glb        hf_20260913_165322_5ef4f528-adf2-44b5-ba76-c7c9bb833279.glb
get dining-set.glb        hf_20260913_165330_5fd42e9e-b409-433d-8c1a-5052e0b15218.glb
get fire-pit.glb          hf_20260913_165339_cd91f179-02af-49bf-8110-7aaf0f3ccb2a.glb
get lantern.glb           hf_20260913_165347_96118a57-fb7d-4a91-9ad4-5574081c5726.glb
get railing.glb           hf_20260913_165355_b13cbd9b-195c-41c4-aeb7-b0efed817daf.glb
get bollard.glb           hf_20260913_165404_cf75e3b0-82ad-437b-a1fe-90e2866ea977.glb
get road-sign.glb         hf_20260913_165412_231a82bd-2b35-4a7f-8cb5-9d9a4b65decf.glb
get flood-mast.glb        hf_20260913_165420_c6bc9056-1307-4f13-a66b-93f175692a0e.glb
get target.glb            hf_20260913_165429_ed3cbc0b-1c2b-441c-8d01-b467156e0fa5.glb
get palm-2.glb            hf_20260913_165439_9d4dfdf6-192d-4801-8546-290bc6ca56ba.glb
get acacia-2.glb          hf_20260913_165449_e80b291b-b6a7-4d9b-9395-05a37bb9e631.glb
get rock-2.glb            hf_20260913_165459_cd268b1d-7dea-4735-8c3f-dddf3af131a0.glb
get shrub-2.glb           hf_20260913_165508_5352fbbe-7849-49e2-b29a-8d24e93de1d3.glb

echo
echo "الملفات في: $OUT"
ls -1 "$OUT"/*.glb 2>/dev/null | wc -l | xargs printf '%s ملف GLB\n'
