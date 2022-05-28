import { memo, useContext, useCallback, useEffect } from 'react';
import { AppContext } from '../lib/AppContext';

import { IoLogoApple, IoLogoWindows } from 'react-icons/io';

const { myAPI } = window;

export const Dropzone = memo(() => {
  const { state, dispatch } = useContext(AppContext);

  const preventDefault = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const afterConvert = useCallback(
    (result: Result) => {
      result.type === 'failed'
        ? dispatch({ type: 'success', success: false })
        : dispatch({ type: 'success', success: true });

      dispatch({ type: 'message', message: true });
      dispatch({ type: 'loading', loading: false });
      dispatch({ type: 'log', log: result.log });
      dispatch({ type: 'desktop', desktop: result.desktop });
    },
    [dispatch]
  );

  const convert = useCallback(
    async (filepath: string): Promise<void> => {
      const mime = await myAPI.mimecheck(filepath);

      if (!mime || !mime.match(/png/)) {
        dispatch({ type: 'loading', loading: false });

        const format = mime ? mime : 'Unknown';
        dispatch({ type: 'log', log: `Unsupported format: ${format}` });
        dispatch({ type: 'message', message: true });
        dispatch({ type: 'success', success: false });

        return;
      }

      if (state.ico) {
        const result = await myAPI.mkIco(filepath);
        afterConvert(result);
      } else {
        const result = await myAPI.mkIcns(filepath);
        afterConvert(result);
      }
    },
    [afterConvert, dispatch, state.ico]
  );

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (state.loading) return;

    preventDefault(e);
    dispatch({ type: 'drag', drag: true });
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    preventDefault(e);
    dispatch({ type: 'drag', drag: false });
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (state.loading) return;

    preventDefault(e);
    dispatch({ type: 'drag', drag: false });

    if (e.dataTransfer) {
      dispatch({ type: 'loading', loading: true });
      const file = e.dataTransfer.files[0];

      await convert(file.path);
    }
  };

  const onClickOS = () => {
    if (state.loading) return;
    dispatch({ type: 'ico', ico: !state.ico });
  };

  const onClickOpen = async () => {
    if (state.loading) return;

    const filepath = await myAPI.openDialog();
    if (!filepath) return;

    dispatch({ type: 'loading', loading: true });
    await convert(filepath);
  };

  useEffect(() => {
    myAPI.menuOpen(async (_e, filepath) => {
      if (!filepath) return;

      dispatch({ type: 'loading', loading: true });
      await convert(filepath);
    });

    return (): void => {
      myAPI.removeMenuOpen();
    };
  }, [convert, dispatch]);

  return (
    <div
      className="drop-message-zone"
      onDrop={onDrop}
      onDragEnter={onDragOver}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="elephant-container">
        <svg
          className={
            state.drag
              ? 'elephant ondrag'
              : state.loading
              ? 'elephant loading'
              : 'elephant'
          }
          onClick={onClickOpen}
          width="104"
          height="121"
          viewBox="0 0 104 121"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter0_d)">
            <path d="M99.7404 72.1849C99.4629 71.7773 99.015 71.5357 98.5364 71.5357C98.4645 71.5357 98.3882 71.5452 98.3171 71.5537C97.1883 71.7146 95.5543 71.3884 93.8219 71.0433C92.7873 70.837 91.7168 70.6228 90.6831 70.5014C89.7154 60.6246 85.2785 57.1236 79.5972 53.5858C74.22 50.2416 64.9874 50.21 62.1757 50.4608C59.282 50.7237 56.1629 49.6643 54.3551 48.9082C54.0828 48.7885 53.8302 48.6718 53.6101 48.5631C56.9339 46.4521 61.1336 39.9829 59.3548 34.4996C58.7141 32.5247 55.4061 30.9352 53.4893 30.1653C49.2022 28.4362 43.5869 27.4189 40.1637 28.3978C40.0405 28.4311 39.9283 28.473 39.811 28.5107C39.6319 28.5725 39.4291 28.6135 39.2644 28.6872C36.2782 25.7284 32.9202 22.9699 27.9233 23.6371C23.3347 24.2461 19.8956 22.7825 19.2243 21.0089C18.6915 19.6216 18.9022 17.799 19.6943 16.953C20.1286 16.4871 20.6886 16.3569 21.3866 16.5676C23.9788 17.3597 30.0548 19.2085 33.9276 14.4C37.1648 10.3751 37.8677 5.19035 38.0064 3.69516C38.0108 3.64123 38.0426 3.59651 38.0869 3.56932C38.4225 3.38604 39.5154 2.70509 39.435 1.81456C39.4041 1.48329 39.1978 1.03101 38.3919 0.757842C37.7958 0.556583 33.7083 -0.562616 33.0144 0.35949C32.8526 0.574561 32.8038 0.851894 32.8579 1.18776C32.9563 1.81456 33.4352 2.58035 33.7982 2.86711C33.8872 3.11309 33.8609 4.21431 33.149 6.83835L33.0412 7.23232C32.5668 9.06315 31.9759 11.3377 28.9759 11.432C27.3101 11.4809 26.2354 10.9036 24.9819 10.2365C23.7333 9.5652 22.3133 8.8038 20.1602 8.74548C16.1302 8.62907 11.2366 13.3751 10.6364 20.3461C10.1216 26.292 16.4838 30.335 18.1947 31.307C17.7639 32.1796 17.717 32.9914 17.7795 33.6191C17.7821 33.6972 17.783 33.78 17.7881 33.8513C16.8024 33.5257 15.2318 33.2501 14.4158 34.3334C13.9096 35.0099 13.7127 35.6718 13.8377 36.3039C13.9679 36.9616 14.4285 37.5347 15.2173 38.0097L15.3826 38.1084C16.3674 38.6992 17.2187 39.2055 17.4825 40.0061C17.5502 40.1988 17.5947 40.6605 17.6486 41.1887C17.8361 43.0916 18.1899 46.6286 20.3882 50.6535C21.3046 52.3372 23.1048 54.1056 24.8165 55.5539C25.2099 55.8963 25.5942 56.2243 25.9555 56.526C24.2796 56.0165 22.2011 55.6036 20.2271 55.8161C16.8872 56.1791 13.1935 58.1976 10.9858 59.4069C10.4395 59.7066 9.96507 59.966 9.62087 60.1322C8.48786 60.2126 7.37721 60.4277 6.30734 60.7772C4.75296 61.2834 3.79555 62.8145 4.03715 64.422C4.31887 66.289 4.91059 68.9257 6.12844 70.8826C7.92333 73.7612 10.8161 74.8718 12.3826 75.2794C13.0094 75.4447 13.6362 75.0952 13.8109 74.482C14.5046 72.0645 19.2243 68.4377 21.0825 68.5182C23.0565 68.5901 24.4892 70.1839 26.0068 71.8718C27.252 73.2559 28.5374 74.6842 30.2657 75.5252C32.2226 76.4749 34.6528 76.1614 36.6818 75.5611C37.653 75.1536 38.5975 74.6388 39.4797 73.9896C40.0219 73.5915 40.5364 73.1478 41.0203 72.6468C41.5574 72.0869 42.0496 71.4599 42.4889 70.7568C43.2093 69.6023 44.1718 67.9495 44.3825 67.475C44.7764 66.5663 45.3493 67.3054 45.3493 67.8605C45.3543 69.3017 44.9553 70.9271 43.944 72.6194C43.1425 73.9581 42.0136 75.0558 40.7557 75.9286C40.6127 76.027 40.4645 76.1213 40.3172 76.2155C40.1784 76.3046 40.0346 76.3944 39.8916 76.4749C40.3308 82.421 45.6584 85.694 47.2479 86.54C44.4005 91.6081 45.148 94.6842 46.2714 97.0298C47.0646 98.687 47.4448 102.448 47.7 104.933C47.8078 105.998 47.8841 106.711 47.9595 107.167C46.8445 107.758 45.8733 110.014 45.8733 110.906C45.8733 111.254 46.0256 111.881 47.0422 112.124C47.5653 112.248 48.1788 112.248 48.6668 112.248H53.4086C53.9876 112.248 54.6026 111.859 55.1684 111.353C55.261 111.277 55.3509 111.21 55.4478 111.124C55.5197 111.514 55.8167 111.938 56.6945 112.128C57.2325 112.24 57.8635 112.248 58.3877 112.248H66.4959C68.1838 112.248 69.4598 110.538 69.5985 108.944L69.6124 108.787L68.5958 107.305C69.2381 102.596 68.9871 99.7461 68.731 98.3108C68.7087 98.1661 68.6865 98.0238 68.665 97.905C71.3011 98.329 78.1709 98.6096 83.7743 94.8271C88.0727 91.9258 90.6605 87.3139 91.4708 81.1128C91.5737 80.3113 91.6497 79.4874 91.6942 78.6594C94.7745 78.0326 97.8953 77.0793 99.8033 73.7566C100.086 73.2596 100.063 72.6593 99.7404 72.1849ZM64.6559 75.2336C64.6515 75.2481 64.644 75.2619 64.6388 75.2763C64.6019 75.3756 64.5541 75.4732 64.4814 75.5657L64.3246 75.767C64.2262 75.8963 64.0968 75.9948 63.9445 76.0625C61.1553 77.3025 58.3789 79.3219 56.928 82.7157C56.3911 83.9695 55.688 85.7464 55.5578 86.2484C55.3035 87.2067 54.6182 86.5619 54.5327 86.0112C54.3049 84.5829 54.448 82.9128 55.1912 81.0819C56.6599 77.4816 60.3398 75.1222 63.2995 73.9765C63.524 73.8892 63.7388 73.891 63.9341 73.9438C63.9616 73.9515 63.9898 73.9592 64.0161 73.9688C64.197 74.0366 64.3535 74.153 64.4717 74.3027C64.4794 74.313 64.4897 74.3207 64.4976 74.3319C64.6815 74.5844 64.7569 74.915 64.6559 75.2336ZM49.9671 44.502C49.5019 44.8335 49.0274 45.1332 48.548 45.4022C48.065 45.6797 47.5947 45.9125 47.0793 46.1362C45.0873 46.9872 43.0765 47.3093 41.38 47.3494C39.6739 47.3812 38.2722 47.1578 37.3053 46.9419C36.3429 46.7141 35.7965 46.4769 35.7965 46.4769L35.77 46.4674C35.4925 46.3468 35.3622 46.0204 35.483 45.7378C35.5994 45.4785 35.8948 45.348 36.164 45.4339C36.164 45.4339 36.6384 45.5854 37.5428 45.7198C38.4386 45.8639 39.7505 45.9709 41.304 45.8457C42.8531 45.7293 44.6491 45.3662 46.3859 44.5647C47.2319 44.1663 48.1321 43.6559 48.9242 43.0651C49.7257 42.4743 50.4689 41.7889 51.0111 41.0139C51.5565 40.2398 51.8657 39.362 51.8076 38.5563C51.7631 37.7504 51.3426 37.0113 50.6978 36.4606C50.541 36.3218 50.3663 36.1883 50.196 36.0761C50.1069 36.0222 50.035 35.9682 49.9364 35.9099L49.6316 35.7446C49.4304 35.6503 49.2247 35.5563 49.0235 35.4629C48.8213 35.373 48.6107 35.3055 48.4094 35.2204C47.5855 34.9207 46.766 34.7142 45.9961 34.5585C45.2263 34.4103 44.505 34.3204 43.8655 34.245C43.2249 34.1814 42.6606 34.1369 42.1945 34.1233C41.2592 34.0874 40.7353 34.0968 40.7353 34.0968H40.7217C40.4983 34.101 40.3106 33.9221 40.3056 33.6985C40.3056 33.4922 40.4538 33.3174 40.6506 33.2867C40.6506 33.2867 40.7894 33.2635 41.0488 33.224C41.3084 33.1881 41.6894 33.1385 42.1724 33.1026C42.6562 33.0622 43.2471 33.0357 43.928 33.0272C44.6081 33.0221 45.3736 33.0666 46.2155 33.1521C47.0532 33.255 47.967 33.4253 48.9158 33.707C49.1531 33.7833 49.3953 33.8552 49.6319 33.9486C49.8691 34.0473 50.1113 34.1455 50.358 34.2492L50.7109 34.4239C50.8274 34.4866 50.9661 34.5671 51.092 34.639C51.343 34.7947 51.5749 34.9567 51.808 35.1443C52.7303 35.879 53.4959 37.083 53.5902 38.4267C53.693 39.7739 53.1784 41.0413 52.4846 42.0349C51.781 43.0427 50.8944 43.8401 49.9671 44.502ZM32.077 32.7104C33.1655 32.7104 34.0433 33.5882 34.0433 34.6767C34.0433 35.7643 33.1655 36.6463 32.077 36.6463C30.9894 36.6463 30.1071 35.7643 30.1071 34.6767C30.1074 33.5882 30.9896 32.7104 32.077 32.7104Z" />
          </g>
          <defs>
            <filter
              id="filter0_d"
              x="0"
              y="0"
              width="104"
              height="120.248"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              />
              <feOffset dy="4" />
              <feGaussianBlur stdDeviation="2" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
              />
              <feBlend
                mode="normal"
                in2="BackgroundImageFix"
                result="effect1_dropShadow"
              />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow"
                result="shape"
              />
            </filter>
          </defs>
        </svg>
      </div>
      <div
        className={
          state.drag ? 'text ondrag' : state.loading ? 'text loading' : 'text'
        }
      >
        Drop your PNGs here...
      </div>
      <div className="switch">
        <div
          className={
            state.loading
              ? 'icon-container loading'
              : state.ico
              ? 'icon-container'
              : 'icon-container unchecked'
          }
          onClick={onClickOS}
        >
          <div className="icon">
            <IoLogoWindows />
          </div>
          <div>ICO</div>
        </div>
        <div
          className={
            state.loading
              ? 'icon-container loading'
              : state.ico
              ? 'icon-container unchecked'
              : 'icon-container'
          }
          onClick={onClickOS}
        >
          <div className="icon apple">
            <IoLogoApple />
          </div>
          <div>ICNS</div>
        </div>
      </div>
    </div>
  );
});

Dropzone.displayName = 'Dropzone';
