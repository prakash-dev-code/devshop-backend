const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const ApiFeature = require("./../utils/apiFeatures");
const redisClient = require("./../middleware/radisClient"); // adjust path as needed

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const item = await Model.findByIdAndDelete(req.params.id);

    if (!item) {
      return next(
        new AppError(`No ${Model.modelName} found with that ID`, 404)
      );
    }

    res.status(200).json({
      status: "success",
      message: "deleted successfully",
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      new AppError(`No ${Model.modelName} found with that ID`, 404);
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.creteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        data: newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      new AppError(`No ${Model.modelName} found with that ID`, 404);
    }

    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };


    // Generate a unique key based on the route and query
    const cacheKey = `${Model.modelName}:${req.originalUrl}`;

    // 1. Check if response exists in Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("⏩ Serving from Redis");
      const doc = JSON.parse(cachedData);
      return res.status(200).json({
        status: "success",
        result: doc.length,
        data: { doc },
      });
    }

    // 2. Not in Redis: Fetch from MongoDB
    const feature = new ApiFeature(Model.find(filter), req.query)
      .filter()
      .sort()
      .pagination();

    const doc = await feature.query;

    // 3. Save result in Redis with TTL (e.g., 60 seconds)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(doc));

    // 4. Send response
    res.status(200).json({
      status: "success",
      result: doc.length,
      data: { doc },
    });
  });
