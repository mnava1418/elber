import { useId } from 'react'

type LogoMarkProps = {
  className?: string
}

function LogoMark({ className }: LogoMarkProps) {
  const uid = useId()
  const cyanId = `${uid}-cyan`
  const orangeId = `${uid}-orange`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1230 1278"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={cyanId} x1="0" y1="0" x2="40%" y2="100%">
          <stop offset="0" stopColor="#D5FFF8" />
          <stop offset="0.55" stopColor="#37D6D0" />
          <stop offset="1" stopColor="#087F8C" />
        </linearGradient>
        <linearGradient id={orangeId} x1="0" y1="0" x2="30%" y2="100%">
          <stop offset="0" stopColor="#FFB71A" />
          <stop offset="0.55" stopColor="#FF8B24" />
          <stop offset="1" stopColor="#FF5815" />
        </linearGradient>
      </defs>
      <path
        d="M 623 43 L 621 43 L 643 86 L 657 124 L 663 147 L 668 182 L 668 218 L 662 258 L 647 304 L 632 335 L 603 379 L 556 430 L 514 465 L 406 542 L 353 586 L 308 633 L 274 680 L 246 735 L 231 784 L 225 832 L 226 865 L 231 897 L 242 934 L 262 978 L 287 1018 L 330 1071 L 359 1100 L 389 1126 L 450 1169 L 519 1206 L 565 1225 L 601 1237 L 604 1236 L 562 1193 L 535 1159 L 507 1113 L 493 1080 L 483 1046 L 478 1009 L 481 956 L 492 913 L 500 893 L 519 858 L 540 830 L 569 801 L 618 762 L 710 702 L 753 671 L 771 656 L 807 620 L 837 578 L 855 541 L 868 499 L 875 447 L 873 390 L 864 343 L 848 296 L 822 244 L 787 193 L 752 151 L 686 88 Z"
        fill={`url(#${cyanId})`}
      />
      <path
        d="M 926 450 L 925 454 L 930 484 L 930 518 L 925 551 L 911 595 L 885 641 L 861 670 L 818 709 L 772 741 L 684 797 L 634 839 L 601 876 L 585 899 L 567 933 L 559 954 L 551 982 L 546 1026 L 549 1067 L 557 1102 L 569 1134 L 590 1172 L 617 1208 L 640 1232 L 642 1231 L 642 1207 L 646 1183 L 656 1154 L 672 1124 L 697 1090 L 732 1054 L 768 1025 L 810 997 L 886 952 L 910 936 L 950 904 L 974 879 L 998 847 L 1022 800 L 1032 768 L 1038 727 L 1036 671 L 1026 624 L 1011 581 L 981 522 L 947 473 Z"
        fill={`url(#${orangeId})`}
      />
    </svg>
  )
}

export default LogoMark
