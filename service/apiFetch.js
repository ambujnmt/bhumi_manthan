import { useStoreLogin } from "@/store/login";
import { fetchWithOutToken } from "@/utils/fetchApi";
import { fetchWithToken_old } from "@/utils/fetchApi";
import { fetchWithOutToken_old } from "@/utils/fetchApi";

export const resetPasswordByOtp = async (data) => {
  const response = await fetchWithOutToken_old('/api/public/user/sent-reset-password-otp',data, {
    method: 'POST',
  });
  if (response.error) {
    // console.error('Error in sent otp to reset Password:', response?.details?.message);
    return {response};
  }
  else {
    return response;
  }
};

export const changeLoginPassword = async (data) => {
  const response = await fetchWithOutToken_old('/api/public/user/reset-password',data, {
    method: 'POST',
  });
  if (response.error) {
    // console.error('Error in change Password:', response?.details?.message);
    return {response};
  }
  else {
    return response;
  }
 
};

export const getOtpRegister = async (data) => {
  const response = await fetchWithOutToken_old('/api/public/user/signup-with-otp',data, {
    method: 'POST',
  });
  if (response.error) {
    // console.error('Error in sent otp:', response?.details?.message);
    return {response};
  }
  else {
    return response;
  }
 
};

export const fileUrlUpload = async (data) => {
  const response = await fetchWithOutToken_old('/api/public/file/upload',data, {
    method: 'POST',
  });
  if (response.error) {
    // console.error('Error in sent otp:', response?.details?.message);
    return {response};
  }
  else {
    return response;
  }
 
};


export const summitRegisterData = async (data) => {
  const response = await fetchWithOutToken_old('/api/public/user/register-student-with-otp',data, {
    method: 'POST',
  });
  if (response.error) {
    // console.error('Error in submit Data:', response?.details?.message);
    return {response};
  }
  else {
    return response;
  }
};

export const getAuthToken = async () => {
  const refreshToken = useStoreLogin.getState().refreshToken;
  const params = {
    refreshToken,
  };
  const response = await fetchWithOutToken("/api/auth/getAuthToken", params, {
    method: "POST",
  });
  if (response.error) {
    // console.error("Error fetching area by ID:", response.error);
    return { error: response.error, details: response?.details };
  }
  return response;
};



// export const getWebsiteData = async (id, params={}) => {
//     const response = await fetchWithOutToken(`/api/s/website/${id}/data`, params);
//     if (response.error) {
      console.error('Error fetching website:', response.error);
//       return { error: response.error, details: response?.details };
//     }
//     return response;
//   };

export const getPageData = async (url,params = {}) => {
    const response = await fetchWithOutToken(`/api/s/frontPage/${url}`, params);
    if (response.error) {
      // console.error('Error fetching frontPage:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  };


  export const getCourses = async () => { 
    const response = await fetchWithOutToken_old(`/api/public/data/all-courses`);
    if (response.error) {
      // console.error('Error fetching courses:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  };

  export const getSession = async () => { 
    const response = await fetchWithOutToken_old(`/api/public/data/sessions`);
    if (response.error) {
      // console.error('Error fetching session:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  };

  export const  getAllCenters = async () => { 
    const response = await fetchWithOutToken_old(`/api/public/data/centers`);
    if (response.error) {
      // console.error('Error fetching center:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  };

  export const getStream = async () => { 
    const response = await fetchWithOutToken_old(`/api/public/data/all-stream?status=true`);
    if (response.error) {
      // console.error('Error fetching stream:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  };

  export const getCourseProgramByUri = async (url, params={}) => {
    const response = await fetchWithOutToken(`/api/s/courseprogram-by-uri/${url}`, params);
    if (response.error) {
      // console.error('Error fetching courseprogram:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  }
  export const getWebberListItem = async (params={}) => {
    const response = await fetchWithOutToken(`/api/s/webberlistitem`, params);
    if (response.error) {
      // console.error('Error fetching webberlistitem:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  }
  export const getTestimonial = async (params={}) => {
    const response = await fetchWithOutToken(`/api/s/testimonial`, params);
    if (response.error) {
      // console.error('Error fetching testimonial:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  }

  
  export const createEnquiry = async (data) => {
    const response = await fetchWithOutToken_old('/api/enquiry/enquiry', data, {
      method: 'POST',
    });
    if (response.error) {
      // console.error('Error in Enquiry:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  };

// Buy Module Api

export const getProductResponse = async (id) => {
  const response = await fetchWithOutToken(`https://v3.edkt.net/api/s/product/${id}`);
  if (response.error) {
    // console.error('Error fetching get Product Response:', response.error);
    return { error: response.error, details: response?.details };
  }
  return response;
};


  export const getCourseById = async (params={}) => {
    const response = await fetchWithOutToken_old(`/api/public/data/courses`, params);
    if (response.error) {
      // console.error('Error fetching course By Id :', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  }

  export const placeOrder = async (data) => {
    const response = await fetchWithOutToken_old('/api/cmn/order/place-order',data, {
      method: 'POST',
    });
    if (response.error) {
      // console.error('Error in Place order:', response?.details?.message);
      return {response};
    }
    else {
      return response;
    }
  };

  export const getProductBatch = async (params={}) => {
    const response = await fetchWithOutToken_old(`/api/public/data/product-batches`, params);
    if (response.error) {
      // console.error('Error in fetching Product Batch :', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  }

  export const getPayMentNode = async (params={}) => {
    const response = await fetchWithOutToken_old(`/api/cmn/order/payment-nodes`, params);
    if (response.error) {
      // console.error('Error fetching PayMent Node:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  }

  export const applyCouponCode = async (id,data) => {
    const response = await fetchWithToken_old(`/api/cmn/order/${id}/add-discount`,data, {
      method: 'POST',
    });
    if (response.error) {
      // console.error('Error in Coupon Apply:', response?.details?.message);
      return {response};
    }
    else {
      return response;
    }
  };

  export const  getCouponCodeDiscount = async (params={}) => {
    const response = await fetchWithOutToken_old(`/api/public/data/get-coupon-discount`,params);
    if (response.error) {
      // console.error('Error in Coupon Apply:', response?.details?.message);
      return {response};
    }
    else {
      return response;
    }
  };

  export const getEmiPaymentOptions = async (id) => { 
    const response = await fetchWithOutToken_old(`/api/public/data/product/${id}/payment-options`);
    if (response.error) {
      // console.error('Error fetching courses:', response.error);
      return { error: response.error, details: response?.details };
    }
    return response;
  };



  



